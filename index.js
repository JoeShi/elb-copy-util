'use strict'

const SRC_LB_ARN = process.env.SRC_LB_ARN || 'arn:aws:elasticloadbalancing:ap-northeast-1:764444585758:loadbalancer/app/test/8fed6ea150d25995'

const SRC_LB_LISTENER_ARN = process.env.SRC_LB_LISTENER_ARN || 'arn:aws:elasticloadbalancing:ap-northeast-1:764444585758:listener/app/test/8fed6ea150d25995/8f371ac42fe365e1'
//const DEST_LB_LISTENER_ARN = process.env.DEST_LB_LISTENER_ARN || 'arn:aws:elasticloadbalancing:ap-northeast-1:764444585758:loadbalancer/app/test-replica/112b85d665911f8a'
const DEST_LB_ARN = process.env.DEST_LB_ARN || 'arn:aws:elasticloadbalancing:ap-northeast-1:764444585758:loadbalancer/app/test-replica/112b85d665911f8a'
const DEST_TG_PREFIX = process.env.DEST_TG_PREFIX || 'copied-tg'
const SRC_TG_PREFIX = process.env.SRC_TG_PREFIX || 'test-nginx'
const DEST_VPC_ID = process.env.DEST_VPC_ID || 'vpc-fe4c0d9a'
const PAGE_SIZE = 10
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-1'
const AWS_SRC_REGION = process.env.AWS_SRC_REGION || 'ap-northeast-1'
const AWS_PROFILE = process.env.AWS_PROFILE


const AWS = require('aws-sdk')

if (AWS_PROFILE) {
  const credentials = new AWS.SharedIniFileCredentials({profile: AWS_PROFILE})
  AWS.config.update({
    credentials: credentials,
    region: AWS_REGION
  })
} else {
  AWS.config.update({
    region: AWS_REGION
  })
}

const elbv2 = new AWS.ELBv2()
const elbv2_src = AWS_SRC_REGION ? new AWS.ELBv2({region: AWS_SRC_REGION}) : elbv2

// Auto created target groups
const newTgs = []


if (DEST_LB_ARN) {
  // Option 1: copy listener and copy rules

  //  while 循环， 对每个listener 执行复制。



 var params = {
  LoadBalancerArn: SRC_LB_ARN,
  //Marker: 'STRING_VALUE',
  PageSize: '100'
};

//列出所有的listener
elbv2.describeListeners(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else  {
    //console.log(data['Listeners']);           // successful response
    //console.log(data['Listeners'].length);

    var i=0;
    while (i< data['Listeners'].length){
        console.log(data['Listeners'][i]['ListenerArn']);
        copyListener(data['Listeners'][i]['ListenerArn'], DEST_LB_ARN).then(listner => {
        console.log(`created listener...\n${JSON.stringify(listner)}\n\n`)
        return copyRules(SRC_LB_LISTENER_ARN, listner.ListenerArn)
      }).then(rules => {
        console.log(`copied rules...\n${JSON.stringify(rules)}\n\n`)
      }).catch(err => {
        console.error(err)
      })
        i++;
    }

   }

 });



} else if (DEST_LB_LISTENER_ARN) {
  // Option 2: copy rules only
  copyRules(SRC_LB_LISTENER_ARN, DEST_LB_LISTENER_ARN).then(rules => {
    console.log(`copied rules...\n${JSON.stringify(rules)}\n\n`)
  }).catch(err => {
    console.error(err)
  })
}


/**
 * Copy an existing Load Balaner and create a new Load Balancer
 * @param {String} src_lb_arn Source Load Balancer ARN
 * @param {String} dest_lb_name Dest Load Balancer Name
 * @returns {Object} Load Balancer Object
 */
async function copyLoadBalancer(src_lb_arn, dest_lb_name) {
  const lb_res = await elbv2_src.describeLoadBalancers({
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
 * Copy a single Target Group and return the TG object.
 * @param {String} src_tg_name 
 * @param {String} dest_tg_prefix
 * @param {String} src_tg_prefix
 */
async function copyTargetGroup(src_tg_name, dest_tg_prefix, src_tg_prefix) {
  const tgs_res = await elbv2_src.describeTargetGroups({ Names: [src_tg_name ]}).promise()
  const tg = tgs_res.TargetGroups[0]
  let newTgParam = {}
  Object.assign(newTgParam, tg)

  newTgParam.Name = getCopiedTargetGroupName(src_tg_name, dest_tg_prefix, src_tg_prefix)

  delete newTgParam.TargetGroupName
  delete newTgParam.TargetGroupArn
  delete newTgParam.LoadBalancerArns
  
  if (DEST_VPC_ID) {
    newTgParam.VpcId = DEST_VPC_ID
  }

  const create_tg_res = await elbv2.createTargetGroup(newTgParam).promise()
  return create_tg_res.TargetGroups[0]
}

/**
 * Get the copied target group name. If parameter src_tg_prefix is provided and its value equal to src_tag_name prefix. 
 * The function will replace the prefix. Otherwise, it will add value of dest_tag_prefix to the src_tag_name.
 * 
 * @param {String} src_tg_name Source target group name
 * @param {*} dest_tg_prefix Destination target group prefix. e.g. abc-target-group, abc is the prefix
 * @param {*} src_tg_prefix Source target group prefix. 
 */
function getCopiedTargetGroupName(src_tg_name, dest_tg_prefix, src_tg_prefix) {

  let tg_name_arrray = src_tg_name.split('-');
  if (src_tg_prefix && tg_name_arrray.length > 1 && tg_name_arrray[0] === src_tg_prefix) {
    tg_name_arrray[0] = dest_tg_prefix
  } else {
    tg_name_arrray.unshift(dest_tg_prefix)
  }

  return tg_name_arrray.join('-')
}

/**
 * Copy the rules from one LB listener to another LB listner. It will also automatically create target groups using the prefix.
 * @param {String} src_lb_listener_arn Source LB listener ARN
 * @param {*} dest_lb_listener_arn Destination LB listener ARN
 */
async function copyRules(src_lb_listener_arn, dest_lb_listener_arn) {

  let hasMoreRule = true
  let marker = null
  let src_rules = []
  let dest_rules = []

  // 1. Iterate and get all existing rules in source listener
  while (hasMoreRule) {
    const rules_res = await elbv2_src.describeRules({ ListenerArn: src_lb_listener_arn, PageSize: PAGE_SIZE, Marker: marker }).promise()
    src_rules = src_rules.concat(rules_res.Rules)
    marker = rules_res.NextMarker
    if (rules_res.Rules.length < PAGE_SIZE ) {
      hasMoreRule = false
    }
  }

  console.log(`rules in source lb listener...\n${JSON.stringify(src_rules)}\n\n`)

  for (let i = 0; i < src_rules.length; i++) {
    const src_rule = src_rules[i]
    if (src_rule.IsDefault === true) { continue } // skip the default rule
    
    console.log(`src rule...\n${JSON.stringify(src_rule)}\n\n`)
    let newRuleParam = {}
    Object.assign(newRuleParam, src_rule)

    delete newRuleParam.RuleArn
    delete newRuleParam.IsDefault
    if (newRuleParam.Actions[0].ForwardConfig) {
      delete newRuleParam.Actions[0].ForwardConfig
    }

    if (newRuleParam.Conditions && newRuleParam.Conditions.length > 0) {
      for (let i = 0; i < newRuleParam.Conditions.length; i++) {
        if (newRuleParam.Conditions[i].HostHeaderConfig) {
          delete newRuleParam.Conditions[i].HostHeaderConfig
        }
    
        if (newRuleParam.Conditions[i].PathPatternConfig) {
          delete newRuleParam.Conditions[i].PathPatternConfig
        }
      }
    }

    newRuleParam.ListenerArn = dest_lb_listener_arn

    // Handle non-default and forward action
    if (src_rule.Actions[0].Type === 'forward' && src_rule.IsDefault === false) {                               
      const targetGroupName = src_rule.Actions[0].TargetGroupArn.split('/')[1]
      let destTargetGroupArn = ''

      // Find the related target group
      const existingTg = newTgs.find(tg => {
        return tg.TargetGroupName === getCopiedTargetGroupName(targetGroupName, DEST_TG_PREFIX, SRC_TG_PREFIX)
      })

      // if not exist, create a new target group
      if (!existingTg) {
        const newTg = await copyTargetGroup(targetGroupName, DEST_TG_PREFIX, SRC_TG_PREFIX)
        console.log(`created new target group...\n${JSON.stringify(newTg)}\n\n`)
        newTgs.push(newTg)
        destTargetGroupArn = newTg.TargetGroupArn
      } else {
        destTargetGroupArn = existingTg.TargetGroupArn
      }
      
      newRuleParam.Actions[0].TargetGroupArn = destTargetGroupArn
    } else if (src_rule.Actions[0].Type === 'redirect' && src_rule.IsDefault === false) {
      
    } else if (src_rule.Actions[0].Type === 'fixed-response' && src_rule.IsDefault === false) {
      
    } else {
      console.log(`unsupported src rule action type...\n${JSON.stringify(src_rule)}\n\n`)
    }
    
    // create new rule
    console.log(`new rule param...\n${JSON.stringify(newRuleParam)}\n\n`)
    const create_rule_res = await elbv2.createRule(newRuleParam).promise()
    console.log(`created new rule...\n${JSON.stringify(create_rule_res.Rules[0])}\n\n`)
    dest_rules.push(create_rule_res.Rules[0])
  }

  return dest_rules
}

/**
 * Copy an existing listner configuration to Load Balancer
 * @param {String} src_lb_listener_arn 
 * @param {String} dest_lb_arn 
 */
async function copyListener(src_lb_listener_arn, dest_lb_arn) {
  
  const listeners_res = await elbv2_src.describeListeners({ ListenerArns: [ src_lb_listener_arn] }).promise()
  const listner = listeners_res.Listeners[0]
  let newListnerParam = listner
  Object.assign(newListnerParam, listner)

  console.log(`listener...\n${JSON.stringify(listner)}\n\n`)

  if (listner.DefaultActions[0].Type === 'forward') {         // Deafult Action: forward
    let destTargetGroupArn = ''
    const targetGroupName = listner.DefaultActions[0].TargetGroupArn.split('/')[1]
    // Find the related target group
    const existingTg = newTgs.find(tg => {
      return tg.TargetGroupName === getCopiedTargetGroupName(targetGroupName, DEST_TG_PREFIX, SRC_TG_PREFIX)
    })

    // if not exist, create a new target group
    if (!existingTg) {
      const newTg = await copyTargetGroup(targetGroupName, DEST_TG_PREFIX, SRC_TG_PREFIX)
      console.log(`created new target group...\n${JSON.stringify(newTg)}\n\n`)
      newTgs.push(newTg)
      destTargetGroupArn = newTg.TargetGroupArn
    } else {
      destTargetGroupArn = existingTg.TargetGroupArn
    }
    
    newListnerParam.DefaultActions[0].TargetGroupArn = destTargetGroupArn

    if (newListnerParam.DefaultActions[0].ForwardConfig) {
      delete newListnerParam.DefaultActions[0].ForwardConfig
    }
    
  } else if (listner.DefaultActions[0].Type === 'fixed-response'){    // Default action: fixed-response
    
  } else if (listner.DefaultActions[0].Type === 'redirect') {         // Default action: redirect

  } else {
    throw new Error(`unsupported default action...\n${JSON.stringify(listner)}\n\n`)
  }

  delete newListnerParam.ListenerArn
  newListnerParam.LoadBalancerArn = dest_lb_arn
  const create_listener_res = await elbv2.createListener(newListnerParam).promise()
  return create_listener_res.Listeners[0]
}