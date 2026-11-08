variable "nom" {
  type    = string
  default = "kanon34"
}
variable "region" {
  type    = string
  default = "eu-central-1"
}
variable "aws_endpoint" {
  description = "AWS API manzili (lokal Moto). Haqiqiy AWS'da — bu blok olib tashlanadi"
  type        = string
  default     = "http://127.0.0.1:4950"
}
variable "web_port" {
  type    = number
  default = 4955
}
