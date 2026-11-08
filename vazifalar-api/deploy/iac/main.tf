# main.tf — vazifalar "infratuzilmasi" (o'quv): Docker tarmog'i + web konteyner, S3 bucket (zaxira) + IAM foydalanuvchi (zaxira skripti uchun, eng kam huquq)
provider "docker" {}

provider "aws" {
  region                      = var.region
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style           = true
  endpoints {
    s3  = var.aws_endpoint
    iam = var.aws_endpoint
    sts = var.aws_endpoint
  }
}

resource "docker_network" "ilova" {
  name = "${var.nom}-iac"
}

resource "docker_image" "web" {
  name         = "nginx:1.30.6-alpine@sha256:0e52bd054126cdc040b1276c0af347aeb02a41b9cfe305d6094767ac30e97949"
  keep_locally = true
}

resource "docker_container" "web" {
  name    = "${var.nom}-iac-web"
  image   = docker_image.web.image_id
  restart = "unless-stopped"
  networks_advanced { name = docker_network.ilova.name }
  ports {
    internal = 80
    external = var.web_port
    ip       = "127.0.0.1"
  }
  labels {
    label = "boshqaruvchi"
    value = "opentofu"
  }
}

resource "aws_s3_bucket" "zaxira" {
  bucket = "${var.nom}-zaxira"
}

resource "aws_s3_bucket_versioning" "zaxira" {
  bucket = aws_s3_bucket.zaxira.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "zaxira" {
  bucket                  = aws_s3_bucket.zaxira.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_user" "zaxira" {
  name = "${var.nom}-zaxira"
}

data "aws_iam_policy_document" "zaxira" {
  statement {
    actions   = ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"]
    resources = [aws_s3_bucket.zaxira.arn, "${aws_s3_bucket.zaxira.arn}/*"]
  }
}

resource "aws_iam_user_policy" "zaxira" {
  name   = "zaxira-yozish"
  user   = aws_iam_user.zaxira.name
  policy = data.aws_iam_policy_document.zaxira.json
}
