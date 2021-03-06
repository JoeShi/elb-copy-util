# AWS ELB 复制工具

目前支持复制一个LB的所有target group, listener和rules，或者复制单个listener下的rule。


## 前提条件
* 本地安装 Node.js
* 配置 AWS Profile
* 创建一个空的目标 LB (无listener）

## 使用方法

### 1. 安装依赖
```
npm install
```

### 2. 配置

  **选项 1: 复制整个LB的target group, listeners & Rules**
  
* SRC_LB_ARN : 来源端的LB ARN
* （在此选项下，无需定义）SRC_LB_LISTENER_ARN: 来源端 Listener ARN
* DEST_LB_ARN: 目标 LB ARN
* （在此选项下，无需定义）DEST_LB_LISTENER_ARN: 目标listener ARN。如果提供了的话，会直接忽略 `DEST_LB_ARN`，只复制此listener。
* DEST_TG_PREFIX: 前缀tag
* SRC_TG_PREFIX: 来源段前缀tag
* AWS_REGION: AWS 区域
* AWS_PROFILE: AWS profile. 如果用的是default profile或者是IAM role，就不用再定义。

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
  # 示例配置
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

### 3. 执行脚本
```
node index.js

```

## 删除创建的资源

* 先删除listener
* 在 **Target Groups** 下, 过滤晒出安出使用 `DEST_TG_PREFIX` tag 的并进行删除。