# AWS ELB Copy Tool

The tool supports the replication of a certain LB, or copy only a certain listener of one LB.



## Prerequites

* install node.js
* Configure your AWS Profile
* create an empty target LB 

## Usage 

### 1. Install dependencies
```
npm install
```

### 2. Configure

  **Option 1: Copy both LB's listeners & Rules**
  
* SRC_LB_ARN : source load balancer ARN 
* （ignore）SRC_LB_LISTENER_ARN: Source load balancer listener ARN 
* DEST_LB_ARN: Dest load balancer ARN 
* （ignore）DEST_LB_LISTENER_ARN: Dest load balancer listener ARN. If this provided, it will ignore `DEST_LB_ARN`, and only copy listener rules. Note: the default rule will be ignored if only copy rules.
* DEST_TG_PREFIX: Dest target group prefix 
* SRC_TG_PREFIX: Source target group prefix 
* AWS_REGION: AWS region
* AWS_PROFILE: AWS profile. 

```
# Example Configuration

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

  **Option 2: Only copy certain listener's rules**
  ```
  # Example configuration
  SRC_LB_LISTENER_ARN=src-lb-listner-arn \
  DEST_LB_LISTENER_ARN=dest-lb-listner-arn \
  DEST_TG_PREFIX=copied-tg \          # Prefix for the new created target groups
  SRC_TG_PREFIX=src-tg \              # Source target group prefix
  DEST_VPC_ID=dest-vpc-id             # Dest VPC ID
  AWS_REGION=cn-north-1 \             # AWS region
  AWS_SRC_REEGION=cn-northwest-1 \    # AWS Source Load Balancer Region
  AWS_PROFILE=zhy \                   # omit this parameter if using default profile
  ```

### 3. Execute the script
```
node index.js  > test.log

```

## Delete created resource

* Delete the listener
* In **Target Groups**, filter all the created target groups using value of `DEST_TG_PREFIX` in **index.js**