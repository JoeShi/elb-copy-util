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

  **Option 1: Copy listner and rules**
  ```
  SRC_LB_LISTENER_ARN=src-lb-listner-arn \
  DEST_LB_ARN=dest-lb-arn \  
  DEST_TG_PREFIX=copied-tg \          # Prefix for the new created target groups
  AWS_REGION=cn-northwest-1 \         # AWS region
  AWS_PROFILE=zhy \                   # omit this parameter if using default profile
  node index.js > test.log
  ```

  **Option 2: Copy rules**
  ```
  SRC_LB_LISTENER_ARN=src-lb-listner-arn \
  DEST_LB_LISTENER_ARN=dest-lb-listner-arn \
  DEST_TG_PREFIX=copied-tg \          # Prefix for the new created target groups
  AWS_REGION=cn-northwest-1 \         # AWS region
  AWS_PROFILE=zhy \                   # omit this parameter if using default profile
  node index.js > test.log
  ```

## Delete created resource

* Delete the listener
* In **Target Groups**, filter all the created target groups using value of `DEST_TG_PREFIX` in **index.js**