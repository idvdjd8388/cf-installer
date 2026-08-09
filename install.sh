#!/bin/bash
set -e
R='\033[0;31m';G='\033[0;32m';Y='\033[0;33m';C='\033[0;36m';W='\033[1;37m';NC='\033[0m'
BACKEND="https://cf-installer-backend.cf-installer.workers.dev"
clear 2>/dev/null||true
echo -e "${C}╔══════════════════════════════════╗${NC}"
echo -e "${C}║    🔥 CF Installer v4.7.0       ║${NC}"
echo -e "${C}╚══════════════════════════════════╝${NC}"
command -v curl&>/dev/null||{echo -e "${R}❌ curl نصب نیست${NC}";exit 1;}
TOKEN_URL="https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=%5B%7B%22key%22%3A%22workers_scripts%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22workers_kv_storage%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22d1%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22workers_settings%22%2C%22type%22%3A%22read%22%7D%2C%7B%22key%22%3A%22user_details%22%2C%22type%22%3A%22read%22%7D%5D&accountId=*&zoneId=all&name=CF-Installer"
echo -e "${W}📝 برای ساخت توکن:${NC}"
echo -e "   لینک زیر رو باز کن،"
echo -e "   ${C}Continue to summary → Create Token${NC} بزن،"
echo -e "   توکن رو کپی کن و اینجا بزن:"
echo -e ""
echo -e "   ${Y}${TOKEN_URL}${NC}"
echo -e ""
echo -e "${W}🔑 Cloudflare API Token:${NC}"
read -rp "   " TOKEN
[[ -z "$TOKEN"||!"$TOKEN"==cfut_* ]]&&{echo -e "${R}❌ توکن نامعتبر${NC}";exit 1;}
echo -e "${C}▶ بررسی...${NC}"
V=$(curl -s -X POST "$BACKEND/deploy" -H "Content-Type: application/json" -H "Origin: https://arshiyashams675-sudo.github.io" -d "{\"token\":\"$TOKEN\",\"panelType\":\"validate\"}")
echo "$V"|grep -q '"success":true'||{echo -e "${R}❌ توکن نامعتبر${NC}";exit 1;}
AN=$(echo "$V"|grep -o '"accountName":"[^"]*"'|cut -d'"' -f4)
echo -e "${G}✅ حساب: ${AN}${NC}"
echo -e "${C}▶ ساب‌دامین...${NC}"
S=$(curl -s -X POST "$BACKEND/get-subdomain" -H "Content-Type: application/json" -H "Origin: https://arshiyashams675-sudo.github.io" -d "{\"token\":\"$TOKEN\"}")
SD=$(echo "$S"|grep -o '"subdomain":"[^"]*"'|cut -d'"' -f4)
echo -e "${G}✅ ${SD}${NC}"
echo ""
echo -e "${W}پنل‌ها:${NC}"
echo "  1) Nahan    2) EdgeTunnel   3) CF-NEW"
echo "  4) EDtunnel 5) FoxCloud     6) VTPanel"
echo "  7) Nova     8) AMCF         9) v2ray-worker"
read -rp "   شماره (۱-۹): " CH
PANEL=("nahan" "edge" "cfnew" "edgtun" "fox" "vtpanel" "nova" "amcf" "v2ray-worker")
[[ $CH -ge 1&&$CH -le 9 ]]||{echo -e "${R}❌ نامعتبر${NC}";exit 1;}
P=${PANEL[$((CH-1))]}
echo -e "${W}🚀 استقرار ${P}...${NC}"
D=$(curl -s -X POST "$BACKEND/deploy" -H "Content-Type: application/json" -H "Origin: https://arshiyashams675-sudo.github.io" -d "{\"token\":\"$TOKEN\",\"panelType\":\"$P\"}")
if echo "$D"|grep -q '"success":true';then
    PU=$(echo "$D"|grep -o '"panelURL":"[^"]*"'|cut -d'"' -f4)
    echo -e "${G}✅ نصب شد!${NC}"
    echo -e "${W}🔗 ${PU}${NC}"
    [[ "$P"=="nahan""$P"=="edge""$P"=="nova" ]]&&echo -e "${Y}🔑 رمز: admin${NC}"
else
    E=$(echo "$D"|grep -o '"error":"[^"]*"'|cut -d'"' -f4)
    echo -e "${R}❌ ${E:-خطا}${NC}";exit 1
fi
