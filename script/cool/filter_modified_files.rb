#!/bin/ruby

current_dir = `pwd`
`git config --global --add safe.directory #{current_dir}`

MODE = ($0 == __FILE__) ? :cli : :lib

def have_we_modified?(file_path)
  blame_result = `git blame -p #{file_path} | grep -i -m1 -E '^author(-mail .+@ntu.edu.tw| pero| Albert Hsieh| kekmeepo| cly| Shawn Li| yjchi| Yinggju Chi| tp9106| 明佑| NTU-CTLD| shawnli)'`
  !blame_result.empty?
end

EXPANDABLE_PATTERN_LIST = "Coolfile".freeze

# Calling filter_modified_files with 0 argument will be INVALID
def filter_modified_files(path_pattern, *path_patterns)
  patterns = [path_pattern] + path_patterns
  modified_tagged_files = []
  if patterns.include?(EXPANDABLE_PATTERN_LIST)
    patterns.delete(EXPANDABLE_PATTERN_LIST)
    expanded_pattern_list = File.read(EXPANDABLE_PATTERN_LIST).split("\n")
    expanded_pattern_list.each do |expanded_pattern|
      if expanded_pattern.start_with?("!")
        # ignore first "!" character when globing
        modified_tagged_files.push(*Dir.glob(expanded_pattern[1..]))
      else
        patterns.push(expanded_pattern)
      end
    end
  end
  modified_file_list = modified_tagged_files
  # uniq in this chained call is for reducing files to check
  $stderr.puts "checking files..." if MODE == :cli
  modified_file_list += patterns.flat_map { |pattern| Dir.glob(pattern) }
                                .uniq
                                .filter_map do |path|
                                  $stderr.printf "." if MODE == :cli
                                  path if File.file?(path) && have_we_modified?(path)
                                end
  $stderr.puts
  # this uniq is for deduping result
  modified_file_list.uniq
end
puts filter_modified_files(*ARGV) if MODE == :cli
