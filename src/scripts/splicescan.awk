{
  n = gsub(/%%/, "%%", $0)
  if (n > 0 && n % 2 == 0) {
    line = $0
    while (match(line, /%%[^%]*(%[^%][^%]*)*%%/)) {
      line = substr(line,1,RSTART-1) substr(line,RSTART+RLENGTH)
    }
    gsub(/[[:space:]]/,"",line)
    if (line != "") print FILENAME ":" FNR ": " $0
  }
}
