# AWS ELB Copy Util

## Prerequites

* node.js
* Configure your AWS Profile

## Usage

1. Install dependencies
```
npm install
```

2. Change the default value of the following variables in **index.js**, or you can pass through environment variables
  * SRC_LB_LISTENER_ARN
  * DEST_LB_LISTENER_ARN
  * DEST_TG_PREFIX
  * AWS_REGION
  * AWS_PROFILE

3. Execute the script
```
node index.js > test.log
```

## Delete created resource

* Delete the listener
* In **Target Groups**, filter all the created target groups using value of `DEST_TG_PREFIX` in **index.js**