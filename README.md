# AWS ELB Copy Util

## Prerequites | 前提条件

* install node.js
* Configure your AWS Profile
* create an empty target LB 

## Usage | 使用方法

### 1. Install dependencies
```
npm install
```

### 1. Configure

  **Option 1: 复制整个LB的listeners & Rules**
  ```
  SRC_LB_LISTENER_ARN=src-lb-listner-arn \
  DEST_LB_ARN=dest-lb-arn \  
  DEST_TG_PREFIX=copied-tg \          # Prefix for the new created target groups
  SRC_TG_PREFIX=src-tg \              # Source target group prefix
  DEST_VPC_ID=dest-vpc-id             # Dest VPC ID
  AWS_REGION=cn-north-1 \             # AWS region
  AWS_SRC_REGION=cn-northwest-1       # AWS Source Load Balancer Region
  AWS_PROFILE=zhy \                   # omit this parameter if using default profile
  node index.js > test.log
  ```
* SRC_LB_ARN : source load balancer ARN |  来源端的LB ARN
* （无需定义）SRC_LB_LISTENER_ARN: Source load balancer listener ARN | 来源端 Listener ARN
* DEST_LB_ARN: Dest load balancer ARN | 目标 LB ARN
* （无需定义）DEST_LB_LISTENER_ARN: Dest load balancer listener ARN. If this provided, it will ignore `DEST_LB_ARN`, and only copy listener rules. Note: the default rule will be ignored if only copy rules.
* DEST_TG_PREFIX: Dest target group prefix | 前缀tag
* SRC_TG_PREFIX: Source target group prefix | source 前缀tag
* AWS_REGION: AWS region
* AWS_PROFILE: AWS profile. 如果用的是default profile或者是IAM role，就不用再多定义。

```
# 示例配置

const SRC_LB_ARN = process.env.SRC_LB_ARN || 'arn:aws:elasticloadbalancing:ap-northeast-1:12345678910:loadbalancer/app/test/8fed6ea150d25995'
//const SRC_LB_LISTENER_ARN = process.env.SRC_LB_LISTENER_ARN || 'arn:aws:elasticloadbalancing:ap-northeast-1:12345678910:listener/app/test/8fed6ea150d25995/8f371ac42fe365e1'
//const DEST_LB_LISTENER_ARN = process.env.DEST_LB_LISTENER_ARN || 'arn:aws:elasticloadbalancing:ap-northeast-1:12345678910:loadbalancer/app/test-replica/112b85d665911f8a'
const DEST_LB_ARN = process.env.DEST_LB_ARN || 'arn:aws:elasticloadbalancing:ap-northeast-1:12345678910:loadbalancer/app/test-replica/112b85d665911f8a'
const DEST_TG_PREFIX = process.env.DEST_TG_PREFIX || 'copied-tg'
const SRC_TG_PREFIX = process.env.SRC_TG_PREFIX || 'test-nginx'
const DEST_VPC_ID = process.env.DEST_VPC_ID || 'vpc-fe4c0d9a'
const PAGE_SIZE = 10
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-1'
const AWS_SRC_REGION = process.env.AWS_SRC_REGION || 'ap-northeast-1'
const AWS_PROFILE = process.env.AWS_PROFILE  #如果用的是default的话

```

  **Option 2: 只复制某个 listener 的 rules**
  ```
  SRC_LB_LISTENER_ARN=src-lb-listner-arn \
  DEST_LB_LISTENER_ARN=dest-lb-listner-arn \
  DEST_TG_PREFIX=copied-tg \          # Prefix for the new created target groups
  SRC_TG_PREFIX=src-tg \              # Source target group prefix
  DEST_VPC_ID=dest-vpc-id             # Dest VPC ID
  AWS_REGION=cn-north-1 \             # AWS region
  AWS_SRC_REEGION=cn-northwest-1 \    # AWS Source Load Balancer Region
  AWS_PROFILE=zhy \                   # omit this parameter if using default profile
  node index.js > test.log
  ```

### 1. Execute the script
```
node index.js

```

## Delete created resource

* Delete the listener
* In **Target Groups**, filter all the created target groups using value of `DEST_TG_PREFIX` in **index.js**