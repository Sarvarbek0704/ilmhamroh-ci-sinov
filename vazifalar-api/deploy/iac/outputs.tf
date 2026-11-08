output "web_url" { value = "http://127.0.0.1:${var.web_port}" }
output "zaxira_bucket" { value = aws_s3_bucket.zaxira.bucket }
output "zaxira_foydalanuvchi" { value = aws_iam_user.zaxira.arn }
