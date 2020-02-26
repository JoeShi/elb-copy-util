# AWS ELB Copy Util

## Prerequites

* node.js
* Configure your AWS Profile

## Usage

1. Install dependencies
```
npm install
```

1. Execute the script

* SRC_LB_LISTENER_ARN: Source load balancer listener ARN
* DEST_LB_ARN: Dest load balancer ARN
* DEST_LB_LISTENER_ARN: Dest load balancer listener ARN. If this provided, it will ignore `DEST_LB_ARN`, and only copy listener rules. Note: the default rule will be ignored if only copy rules.
* DEST_TG_PREFIX: Dest target group prefix
* SRC_TG_PREFIX: Source target group prefix
* AWS_REGION: AWS region
* AWS_PROFILE: AWS profile. Omit this if using default profile or IAM role


  **Option 1: Copy listner and rules**
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

  **Option 2: Copy rules**
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

## Delete created resource

* Delete the listener
* In **Target Groups**, filter all the created target groups using value of `DEST_TG_PREFIX` in **index.js**