CONFLICT_HINT_PATTERN = /<{7}|={7}|>{7}/.freeze
MODE = ($0 == __FILE__) ? :cli : :lib

def capture_conflict(file)
  lines = File.read(file).split("\n")
  conflict_hint_indexes = lines.each_with_index.filter_map do |line, index|
    index if line.match?(CONFLICT_HINT_PATTERN)
  end

  raise "Unmatched conflict hints!" unless conflict_hint_indexes.size.modulo(3).zero?

  conflict_hint_indexes.each_slice(3).map do |index_slice|
    {
      ours: lines[(index_slice[0] + 1)...index_slice[1]],
      theirs: lines[(index_slice[1] + 1)...index_slice[2]],
    }
  end
end

if MODE == :cli
  conflicts = capture_conflict(ARGV[0])
  formatted_conflicts = conflicts.map do |conflict|
    [
      "<" * 7,
      *conflict[:ours],
      "=" * 7,
      *conflict[:theirs],
      ">" * 7,
    ].join("\n")
  end
  conflict_message = formatted_conflicts.join("\n\n")
  puts conflict_message
end
