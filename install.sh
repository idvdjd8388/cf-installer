#!/bin/bash
set -e
R='\033[0;31m'
G='\033[0;32m'
Y='\033[0;33m'
C='\033[0;36m'
W='\033[1;37m'
NC='\033[0m'
BACKEND="https://cf-installer-backend.cf-installer.workers.dev"

clear 2>/dev/null || true
echo -e "${C}╔════════════════════════════════════╗${NC}"
echo -e "${C}║    🔥 CF Installer v7.0.0          ║${NC}"
echo -e "${C}║  Install VPN panels on Workers    ║${NC}"
echo -e "${C}║  API v1 • Enhanced Security       ║${NC}"
echo -e "${C}╚════════════════════════════════════╝${NC}"

if ! command -v curl &>/dev/null; then
    echo -e "${R}❌ curl not installed: pkg install curl${NC}"
    exit 1
fi

# Fix for curl|bash: read from /dev/tty when stdin is not a terminal
if [ ! -t 0 ]; then
    exec </dev/tty
fi

TOKEN_URL="https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=%5B%7B%22key%22%3A%22workers_scripts%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22workers_kv_storage%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22d1%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22workers_settings%22%2C%22type%22%3A%22read%22%7D%2C%7B%22key%22%3A%22user_details%22%2C%22type%22%3A%22read%22%7D%5D&accountId=*&zoneId=all&name=CF-Installer"
echo ""
echo -e "${W}📝 Create an API token:${NC}"
echo -e "   Open the link below,"
echo -e "   click ${C}Continue to summary → Create Token${NC},"
echo -e "   copy the token and paste here:"
echo ""
echo -e "   ${Y}${TOKEN_URL}${NC}"
echo ""
echo -e "${W}🔑 Cloudflare API Token:${NC}"
read -rp "   > " TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${R}❌ No token entered. Please enter your token.${NC}"
    exit 1
fi

if [[ ${#TOKEN} -lt 20 ]]; then
    echo -e "${R}❌ Token too short — get one from https://dash.cloudflare.com/profile/api-tokens${NC}"
    exit 1
fi

show_error() {
    local json="$1"
    local msg=$(echo "$json" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    local code=$(echo "$json" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    local cat=$(echo "$json" | grep -o '"category":"[^"]*"' | cut -d'"' -f4)
    echo -e "${R}❌ Error: ${msg:-unknown}${NC}"
    [ -n "$code" ] && echo -e "   ${Y}Code: $code${NC}"
    [ -n "$cat" ] && echo -e "   ${Y}Category: $cat${NC}"
    if [ "$cat" = "AUTH_ERROR" ]; then
        echo -e "   ${C}→ Recreate token with required permissions${NC}"
    elif [ "$cat" = "RATE_LIMIT_ERROR" ]; then
        echo -e "   ${C}→ Rate limited — wait a few minutes${NC}"
    elif [ "$cat" = "QUOTA_ERROR" ]; then
        echo -e "   ${C}→ Worker limit reached — delete one first${NC}"
    fi
}

echo -e "${C}▶ Validating account...${NC}"
V=$(curl -s -X POST "$BACKEND/v1/deploy" \
    -H "Content-Type: application/json" \
    -H "Origin: https://idvdjd8388.github.io" \
    -d "{\"token\":\"$TOKEN\",\"panelType\":\"validate\"}")

if ! echo "$V" | grep -q '"success":true'; then
    show_error "$V"
    exit 1
fi

AN=$(echo "$V" | grep -o '"accountName":"[^"]*"' | cut -d'"' -f4)
echo -e "${G}✅ Account: ${AN}${NC}"

echo -e "${C}▶ Getting subdomain...${NC}"
S=$(curl -s -X POST "$BACKEND/v1/get-subdomain" \
    -H "Content-Type: application/json" \
    -H "Origin: https://idvdjd8388.github.io" \
    -d "{\"token\":\"$TOKEN\"}")

SD=$(echo "$S" | grep -o '"subdomain":"[^"]*"' | cut -d'"' -f4)
if [ -z "$SD" ]; then
    show_error "$S"
    echo -e "${Y}⚠️ Continuing without subdomain — worker will still deploy${NC}"
    SD="unknown"
else
    echo -e "${G}✅ Subdomain: ${SD}${NC}"
fi

echo ""
echo -e "${W}📋 Available panels:${NC}"
echo "  1) Nahan       2) EdgeTunnel   3) CF-NEW"
echo "  4) EDtunnel    5) FoxCloud     6) VTPanel"
echo "  7) Nova        8) AMCF         9) v2ray-worker"
echo ""
read -rp "   Panel (1-9): " CH

# Validate numeric input
if ! [[ "$CH" =~ ^[0-9]+$ ]]; then
    echo -e "${R}❌ Please enter a number${NC}"
    exit 1
fi

PANELS=("nahan" "edge" "cfnew" "edgtun" "fox" "vtpanel" "nova" "amcf" "v2ray-worker")
if [ "$CH" -lt 1 ] || [ "$CH" -gt 9 ]; then
    echo -e "${R}❌ Invalid choice${NC}"
    exit 1
fi
P=${PANELS[$((CH-1))]}

echo ""
echo -e "${W}🔧 Install mode:${NC}"
echo "   1) ⚡ Normal install"
echo "   2) 🔒 Obfuscated (16-digit key + Web Crypto AES-GCM)"
echo ""
read -rp "   Mode (1-2, default 1): " MH
case "$MH" in
    2)
        MODE="obfuscated"
        ;;
    *)
        MODE="normal"
        ;;
esac
echo -e "${C}✓ Selected mode: ${MODE}${NC}"
if [ "$MODE" = "obfuscated" ]; then
    echo -e "${Y}🔒 رمزنگاری با Web Crypto AES-GCM در سرور انجام می‌شود${NC}"
    echo -e "${Y}🔑 کلید ۱۶ رقمی پس از نصب نمایش داده می‌شود${NC}"
fi

SN_VAL=""
if [ "$P" = "nova" ]; then
    echo ""
    echo -e "${W}🏷️  SUBNAME for Nova:${NC}"
    read -rp "   SUBNAME (Enter for default NovaProxy): " SN
    if [ -z "$SN" ]; then
        SN_VAL="NovaProxy"
    else
        SN_VAL="$SN"
    fi
    echo -e "${G}✅ SUBNAME: ${SN_VAL}${NC}"
fi

echo ""
echo -e "${W}🚀 Deploying ${P} (${MODE}) via /v1/deploy...${NC}"

# Build JSON payload safely using heredoc
if [ -n "$SN_VAL" ]; then
    PAYLOAD=$(cat <<EOF
{"token":"${TOKEN}","panelType":"${P}","installMode":"${MODE}","subname":"${SN_VAL}"}
EOF
)
else
    PAYLOAD=$(cat <<EOF
{"token":"${TOKEN}","panelType":"${P}","installMode":"${MODE}"}
EOF
)
fi

D=$(curl -s -X POST "$BACKEND/v1/deploy" \
    -H "Content-Type: application/json" \
    -H "Origin: https://idvdjd8388.github.io" \
    -d "$PAYLOAD")

if echo "$D" | grep -q '"success":true'; then
    PU=$(echo "$D" | grep -o '"panelURL":"[^"]*"' | cut -d'"' -f4)
    DU=$(echo "$D" | grep -o '"dashboardURL":"[^"]*"' | cut -d'"' -f4)
    OBK=$(echo "$D" | grep -o '"obfuscationKey":"[^"]*"' | cut -d'"' -f4)
    echo ""
    echo -e "${G}✅ Deployed successfully!${NC}"
    echo -e "${W}🔗 Panel URL:  ${C}${PU}${NC}"
    echo -e "${W}📋 Dashboard:  ${C}${DU}${NC}"
    if [ -n "$OBK" ]; then
        echo -e "${Y}🔒 Obfuscation Key: ${OBK:0:4}**** (16-digit, AES-GCM)${NC}"
    fi
    if [ "$P" = "nahan" ] || [ "$P" = "edge" ] || [ "$P" = "nova" ]; then
        echo -e "${Y}🔑 Default password: admin (change it!)${NC}"
    fi
    echo -e "${W}📦 Install mode: ${MODE}${NC}"
else
    show_error "$D"
    exit 1
fi
