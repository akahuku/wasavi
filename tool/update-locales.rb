#!/usr/bin/ruby

require 'optparse'
require 'json'

dir = ''

parser = OptionParser.new
parser.on('--indir directory') {|v| dir = v}
parser.parse(ARGV)

if dir == '' then
	print "missing base directory.\n"
	exit 1
end

locales = Dir.entries(dir)
.select{|entry|
	entry != "." && entry != ".." && File.directory?(dir + "/" + entry)
}
.sort

out = JSON.pretty_generate(locales)
File.write(dir + "/locales.json", out)
