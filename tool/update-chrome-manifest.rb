#!/usr/bin/ruby

require 'optparse'
require 'json'

dir = ''
outdir = ''
ver = ''
strip_update_url = false
update_url = false
manifest = 'manifest.json'

parser = OptionParser.new
parser.on('--indir directory') {|v| dir = v}
parser.on('--outdir directory') {|v| outdir = v}
parser.on('--ver string') {|v| ver = v}
parser.on('--strip-update-url') {strip_update_url = true}
parser.on('--update-url url') {|v| update_url = v}
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
	content = File.read("#{dir}/#{manifest}")
rescue
	print "cannot read #{dir}/#{manifest}"
	exit 1
end

content = JSON.load(content)
content["version"] = ver
if update_url != false && content.key?("update_url") then
	content["update_url"] = update_url
end
if strip_update_url then
	content.delete("update_url")
end

content = JSON.pretty_generate(content)

if outdir != '' then
	File.write("#{outdir}/#{manifest}", content)
else
	print content
end
