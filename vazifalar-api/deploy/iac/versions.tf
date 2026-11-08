# versions.tf — 34-qism #29–#30 (O-76, O-77): OpenTofu 1.13 — infratuzilma kodda. Provayderlar versiyasi qotirilgan (.terraform.lock.hcl — git'da).
#   Lokal sinov: Docker provider (konteynerlar) + AWS provider → Moto (lokal emulyator; haqiqiy AWS hisobi YO'Q). State — S3 (lokal MinIO) + lock fayl.
terraform {
  required_version = ">= 1.10.0"
  required_providers {
    docker = { source = "kreuzwerker/docker", version = "4.6.0" }
    aws    = { source = "hashicorp/aws", version = "6.71.0" }
  }
  # remote state: S3-mos ombor (MinIO), qulf — use_lockfile (S3 ichidagi .tflock; DynamoDB shart emas). Kirish ma'lumotlari — env (AWS_ACCESS_KEY_ID…), kodda EMAS
  backend "s3" {
    bucket                      = "tofu-state"
    key                         = "vazifalar/terraform.tfstate"
    region                      = "us-east-1"
    use_lockfile                = true
    use_path_style              = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_region_validation      = true
    skip_s3_checksum            = true
    # endpoints.s3 — `tofu init -backend-config=endpoints={s3="http://…"}` bilan (muhitga xos)
  }
}
