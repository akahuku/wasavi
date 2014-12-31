#!/usr/bin/ruby

require 'optparse'
require 'json'

dir = ''
outdir = ''
ver = ''
package = 'package.json'

parser = OptionParser.new
parser.on('--indir directory') {|v| dir = v}
parser.on('--outdir directory') {|v| outdir = v}
parser.on('--ver string') {|v| ver = v}
parser.parse(ARGV)

if dir == '' then
	print "missing base directory.\n"
	exit 1
end
if ver == '' then
	print "missing version.\n"
	exit 1
end

begin
	content = File.read("#{dir}/#{package}")
rescue
	print "cannot read #{dir}/#{package}"
	exit 1
end

content = JSON.load(content)
content["version"] = ver
content = JSON.pretty_generate(content)

if outdir != '' then
	File.write("#{outdir}/#{package}", content)
else
	print content
end
