terraform {
  required_version = ">= 1.5.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "account_id" { type = string }
variable "zone_id" { type = string }
variable "api_token" { type = string }
variable "r2_bucket_name" { type = string }

provider "cloudflare" {
  api_token = var.api_token
}

resource "cloudflare_workers_kv_namespace" "sports_cache" {
  account_id = var.account_id
  title      = "bsi-sports-cache"
}

resource "cloudflare_d1_database" "observability" {
  account_id = var.account_id
  name       = "bsi-observability"
}

resource "cloudflare_r2_bucket" "assets" {
  account_id = var.account_id
  name       = var.r2_bucket_name
}

resource "cloudflare_workers_script" "sports_gateway" {
  account_id = var.account_id
  name       = "blaze-sports-gateway"
  content    = file("../src/index.ts")

  kv_namespace_binding {
    name         = "SPORTS_CACHE"
    namespace_id = cloudflare_workers_kv_namespace.sports_cache.id
  }

  d1_database_binding {
    name        = "OBS_DB"
    database_id = cloudflare_d1_database.observability.id
  }

  r2_bucket_binding {
    name        = "ASSET_BUCKET"
    bucket_name = cloudflare_r2_bucket.assets.name
  }

  plain_text_binding {
    name = "UPSTREAM_BASE_URL"
    text = "https://www.blazesportsintel.com"
  }
}

resource "cloudflare_workers_route" "sports_api" {
  zone_id = var.zone_id
  pattern = "api.blazesportsintel.com/api/sports/*"
  script_name = cloudflare_workers_script.sports_gateway.name
}

resource "cloudflare_workers_route" "unified_api" {
  zone_id = var.zone_id
  pattern = "api.blazesportsintel.com/api/unified/*"
  script_name = cloudflare_workers_script.sports_gateway.name
}
