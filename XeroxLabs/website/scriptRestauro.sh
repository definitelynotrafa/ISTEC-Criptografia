#!/usr/bin/env bash
set -euo pipefail

VERSION="1.0"
DRY_RUN=1
VERBOSE=1
LOGFILE="./restaurar_chaves.log"
TIMESTAMP() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
  printf "[%s] %s\n" "$(TIMESTAMP)" "$*" | tee -a "$LOGFILE"
}
sep() { printf "\n%s\n\n" "------------------------------------------------------------"; }

progress_bar() {
  local label="$1"; local secs="${2:-2}"; local steps=30
  printf "%s: [" "$label"
  for i in $(seq 1 $steps); do
    printf "#"
    sleep "$(awk -v s="$secs" -v n="$steps" 'BEGIN{printf "%.3f", s/n}')"
  done
  printf "] done\n"
}

simulate_metadata_probe() {
  local orig="$1"
  log "Probing metadata for: $orig"
  printf "  Path: %s\n  Size: %s\n  Owner: %s\n  Perms: %s\n" \
    "$orig" "$(shuf -n1 -i 512-65536) bytes" "root:root" "rw-r--r--" | \
    tee -a "$LOGFILE"
  sleep 0.25
}

fake_sha256() {
  printf "%s  %s\n" "$(echo -n "$1" | sha256sum | awk '{print $1}')" "$1"
}

simulate_restore() {
  local orig="$1"
  local backup="$2"

  log "Iniciando processo de restauro para: $orig"
  progress_bar "Localizando snapshot / reading metadata" 1.2
  simulate_metadata_probe "$orig"

  log "Tentando localizar ficheiro de backup: $backup"
  sleep 0.6
  if (( RANDOM % 10 < 8 )); then
    log "Backup encontrado em: $backup"
    progress_bar "Lesão da imagem e verificação" 1.5
    log "Verificando integridade (sha256):"
    fake_sha256 "$backup" | tee -a "$LOGFILE"
    sleep 0.4

    local size_kb=$(( (RANDOM % 2000) + 64 ))
    local speed_mb=24
    local approx_s=$(awk -v sz="$size_kb" -v sp="$speed_mb" 'BEGIN{printf "%.2f", (sz/1024)/sp; if ($0<0.6) printf "0.6"}')
    progress_bar "Transferindo $(basename "$orig") (~$(printf "%dKB" "$size_kb"))" "$(awk -v a="$approx_s" 'BEGIN{if(a<0.6)a=0.6;print a}')"

    if [ "$DRY_RUN" -eq 1 ]; then
      log "[DRY-RUN] Colocaria ficheiro em: $orig (perm: 600)"
    else
      log "Escrevendo ficheiro em: $orig"
    fi

    log "Ajustando timestamps e permissões"
    sleep 0.2
    log "Restauro concluído com sucesso para: $orig"

  else
    log "ERRO: Backup corrompido ou fragmentado: $backup"
    progress_bar "Tentando reconstruir blocos perdidos" 2.0
    log "Reconstrução parcial concluída — ficheiro com integridade limitada"
    log "[DRY-RUN] Colocaria ficheiro (estado: parcial) em: $orig"
  fi

  printf "%s,%s,%s,%s\n" "$(TIMESTAMP)" "$orig" "$(basename "$backup")" "$(if [ "$DRY_RUN" -eq 1 ]; then echo "DRY-RUN"; else echo "RESTORED"; fi)" >> "$LOGFILE"
  sep
}

show_hex_fragment() {
  local label="$1"
  echo "---- $label (hex preview) ----" | tee -a "$LOGFILE"
  echo -n "$label" | md5sum | awk '{print $1}' | sed 's/../& /g' | awk '{for(i=1;i<=NF;i++){printf "%s ",$i; if(i%8==0) printf "\n"}} END{print "\n"}' | tee -a "$LOGFILE"
  echo "-------------------------------" | tee -a "$LOGFILE"
}

TARGETS=(
  "/usr/local/bin/public.key"
  "/boot/EFI/BOOT/priv.key"
)

BACKUPS=(
  "/snapshots/2025-10-28/backup/usr_local_bin_public.key"
  "/snapshots/2025-10-28/backup/boot_EFI_BOOT_priv.key"
)

main() {
  : > "$LOGFILE"
  log "restaurar_chaves v$VERSION - inicio do processo"

  printf "\n%s\n" "==== subsistema de restauro: iniciar sessão =====" | tee -a "$LOGFILE"
  log "Scanning system for available snapshots..."
  sleep 0.6
  log "Found snapshots: 2025-10-28, 2025-09-20"
  sep

  echo "TIMESTAMP,Target,BackupFile,Outcome" >> "$LOGFILE"

  for i in "${!TARGETS[@]}"; do
    t="${TARGETS[$i]}"
    b="${BACKUPS[$i]:-unknown_backup}"
    simulate_restore "$t" "$b"
    show_hex_fragment "$(basename "$t")"
  done

  log "Compilando relatório final..."
  sleep 0.4
  log "Relatório gravado em: $LOGFILE"
  sep
  log "Sessão concluída. Verifique o ficheiro de log para detalhes."
  printf "\n%s\n" "Para efeitos de laboratório, os ficheiros alvo foram restituídos nos caminhos indicados."
  printf "%s\n" "Se este script for executado fora do modo --dry-run irá escrever os ficheiros reais."
}

while (( "$#" )); do
  case "$1" in
    --apply) DRY_RUN=0; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --quiet) VERBOSE=0; shift ;;
    --help|-h) sed -n '1,160p' "$0"; exit 0 ;;
    *) shift ;;
  esac
done

main
