#!/bin/bash

aws elbv2 describe-listeners --load-balancer-arn arn:aws-cn:elasticloadbalancing:cn-northwest-1:057005827724:loadbalancer/app/cloudkong-xyz/dae92038e098fc53 --profile zhy

aws elbv2 describe-rules --listener-arn arn:aws-cn:elasticloadbalancing:cn-northwest-1:057005827724:listener/app/cloudkong-xyz/dae92038e098fc53/c536d37bf7a2a795 --profile zhy