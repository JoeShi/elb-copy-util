'use strict'

const SRC_LB_ARN = process.env.SRC_LB_ARN || 'arn:aws-cn:elasticloadbalancing:cn-northwest-1:057005827724:loadbalancer/app/cloudkong-xyz/dae92038e098fc53'
const SRC_LB_LISTENER_ARN = process.env.SRC_LB_LISTENER_ARN || 'arn:aws-cn:elasticloadbalancing:cn-northwest-1:057005827724:listener/app/cloudkong-xyz/dae92038e098fc53/c536d37bf7a2a795'
const DEST_LB_LISTENER_ARN = process.env.DEST_LB_LISTENER_ARN || 'arn:aws-cn:elasticloadbalancing:cn-northwest-1:057005827724:listener/app/demo-lb/48872b1662c5d6ff/ca45dc835b7cb732'
const DEST_TG_PREFIX = process.env.DEST_TG_PREFIX || 'demo-tg'
const PAGE_SIZE = 10
const AWS_REGION = process.env.AWS_REGION || 'cn-northwest-1'
const AWS_PROFILE = process.env.AWS_PROFILE

const AWS = require('aws-sdk')

AWS.config.update({
  region: AWS_REGION
})

if (AWS_PROFILE) {
  const credentials = new AWS.SharedIniFileCredentials({profile: AWS_PROFILE})
  AWS.config.update({
    credentials: credentials
  })
}

const elbv2 = new AWS.ELBv2()

// Auto created target groups
const newTgs = []

try {
  
  // copyLoadBalancer(SRC_LB_ARN, 'demo-lb').then(lb => {
  //   console.log(`create new load balancer: ${lb.LoadBalancerArn}`)
  //   console.log(lb)
  // })

  
  copyRules(SRC_LB_LISTENER_ARN, DEST_LB_LISTENER_ARN, DEST_TG_PREFIX).then(rules => {

console.log(`copied rules...\n${JSON.stringify(rules)}\n\n`)

  }).catch(err => {
    console.error(err)
  })


} catch(e) {
  console.error(e)
}

/**
 * Copy an existing Load Balaner and create a new Load Balancer
 * @param {String} src_lb_arn Source Load Balancer ARN
 * @param {String} dest_lb_name Dest Load Balancer Name
 * @returns {Object} Load Balancer Object
 */
async function copyLoadBalancer(src_lb_arn, dest_lb_name) {
  const lb_res = await elbv2.describeLoadBalancers({
    LoadBalancerArns: [ src_lb_arn ]
  }).promise()

  const lb = lb_res.LoadBalancers[0]
  const AZs = lb.AvailabilityZones
  const Subnets = []

  AZs.forEach(az => {
    Subnets.push(az.SubnetId)
  })

  lb.Subnets = Subnets
  lb.Name = dest_lb_name
  delete lb.AvailabilityZones
  delete lb.CanonicalHostedZoneId
  delete lb.CreatedTime
  delete lb.DNSName
  delete lb.LoadBalancerArn
  delete lb.LoadBalancerName
  delete lb.VpcId
  delete lb.State

  const create_lb_res = await elbv2.createLoadBalancer(lb).promise()

  return create_lb_res.LoadBalancers[0]
}

/**
 * Copy existing target groups from LB and create new target groups
 * 
 * @deprecated
 * @param {String} src_lb_arn Source Load Balancer ARN
 * @param {String} new_tg_prefix The prefix of newly created target group
 */
async function copyTargetGroups(src_lb_arn, new_tg_prefix) {
  const tgs_res = await elbv2.describeTargetGroups({ LoadBalancerArn: src_lb_arn }).promise()
  const tgs = tgs_res.TargetGroups
  const newTgs = []

  for (let i = 0; i < tgs.length; i++) {
    const tg = tgs[i]
    tg.Name = `${new_tg_prefix}-${tg.TargetGroupName}`
    delete tg.TargetGroupName
    delete tg.TargetGroupArn
    delete tg.LoadBalancerArns

    const create_tg_res = await elbv2.createTargetGroup(tg).promise()
    
    newTgs.push(create_tg_res.TargetGroups[0])
  }

  return { oldTgs: tgs, newTgs: newTgs }
}



/**
 * Copy a single Target Group and return the TG object.
 * @param {String} src_tg_name 
 * @param {String} dest_tg_name 
 */
async function copyTargetGroup(src_tg_name, dest_tg_prefix) {
  const tgs_res = await elbv2.describeTargetGroups({ Names: [src_tg_name ]}).promise()
  const tg = tgs_res.TargetGroups[0]
  let newTgParam = {}
  Object.assign(newTgParam, tg)
  newTgParam.Name = `${dest_tg_prefix}-${newTgParam.TargetGroupName}`
  delete newTgParam.TargetGroupName
  delete newTgParam.TargetGroupArn
  delete newTgParam.LoadBalancerArns

  const create_tg_res = await elbv2.createTargetGroup(newTgParam).promise()
  return create_tg_res.TargetGroups[0]
}

/**
 * Copy the rules from one LB listener to another LB listner. It will also automatically create target groups using the prefix.
 * @param {String} src_lb_listener_arn Source LB listener ARN
 * @param {*} dest_lb_listener_arn Destination LB listener ARN
 * @param {*} dest_tg_prefix Destintion Target Group Prefix
 */
async function copyRules(src_lb_listener_arn, dest_lb_listener_arn, dest_tg_prefix) {

  let hasMoreRule = true
  let marker = null
  let src_rules = []
  let dest_rules = []

  // 1. Iterate and get all existing rules in source listener
  while (hasMoreRule) {
    const rules_res = await elbv2.describeRules({ ListenerArn: src_lb_listener_arn, PageSize: PAGE_SIZE, Marker: marker }).promise()
    src_rules = src_rules.concat(rules_res.Rules)
    marker = rules_res.NextMarker
    if (rules_res.Rules.length < PAGE_SIZE ) {
      hasMoreRule = false
    }
  }

console.log(`rules in source lb listener...\n${JSON.stringify(src_rules)}\n\n`)

  for (let i = 0; i < src_rules.length; i++) {
    const src_rule = src_rules[i]

console.log(`src rule...\n${JSON.stringify(src_rule)}\n\n`)

    // Handle non-default and forward action
    if (src_rule.Actions[0].Type === 'forward' && src_rule.IsDefault === false) {                               
      const targetGroupName = src_rule.Actions[0].TargetGroupArn.split('/')[1]
      let destTargetGroupArn = ''

      // Find the related target group
      const existingTg = newTgs.find(tg => {
        return tg.TargetGroupName === `${dest_tg_prefix}-${targetGroupName}`
      })

      // if not exist, create a new target group
      if (!existingTg) {
        const newTg = await copyTargetGroup(targetGroupName, dest_tg_prefix)
console.log(`created new target group...\n${JSON.stringify(newTg)}\n\n`)
        newTgs.push(newTg)
        destTargetGroupArn = newTg.TargetGroupArn
      } else {
        destTargetGroupArn = existingTg.TargetGroupArn
      }

      const newRuleParam = {}
      Object.assign(newRuleParam, src_rule)

      delete newRuleParam.RuleArn
      delete newRuleParam.IsDefault
      
      // Delete the config
      if (newRuleParam.Actions[0].ForwardConfig) {
        delete newRuleParam.Actions[0].ForwardConfig
      }

      if (newRuleParam.Conditions[0].HostHeaderConfig) {
        delete newRuleParam.Conditions[0].HostHeaderConfig
      }

      if (newRuleParam.Conditions[0].PathPatternConfig) {
        delete newRuleParam.Conditions[0].PathPatternConfig
      }
      
      newRuleParam.Actions[0].TargetGroupArn = destTargetGroupArn
      newRuleParam.ListenerArn = dest_lb_listener_arn

console.log(`new rule param...\n${JSON.stringify(newRuleParam)}\n\n`)

      const create_rule_res = await elbv2.createRule(newRuleParam).promise()
console.log(`created new rule...\n${JSON.stringify(create_rule_res.Rules[0])}\n\n`)
      dest_rules.push(create_rule_res.Rules[0])

    } else {
      // TODO: handle Action which is not forward

    }
  }

  return dest_rules
}


async function copyListener(src_lb_listener_arn, dest_lb_arn) {
  const listeners_res = await elbv2.describeListeners({
    ListenerArns: [
      src_lb_listener_arn
    ]
  }).promise()

  const listner = listeners_res.Listeners[0]
  if (listner.DefaultActions[0].Type === 'forward') {
    defaultTargetGroupName = listner.DefaultActions[0].TargetGroupArn.split('/')[1]
    // Find the related target group
    const existingTg = newTgs.find(tg => {
      return tg.TargetGroupName === `${dest_tg_prefix}-${targetGroupName}`
    })

    // if not exist, create a new target group
    if (!existingTg) {
      const newTg = await copyTargetGroup(targetGroupName, dest_tg_prefix)
console.log(`created new target group...\n${JSON.stringify(newTg)}\n\n`)
      newTgs.push(newTg)
      destTargetGroupArn = newTg.TargetGroupArn
    } else {
      destTargetGroupArn = existingTg.TargetGroupArn
    }    
  }

  let newListnerParam = {}
  Object.assign(newListnerParam, listner)
  delete newListnerParam.ListenerArn



}