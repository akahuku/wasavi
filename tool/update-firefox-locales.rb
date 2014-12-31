#!/usr/bin/ruby

require 'optparse'
require 'json'

dir = ''
localedir = ''

parser = OptionParser.new
parser.on('--indir directory') {|v| dir = v}
parser.on('--localedir directory') {|v| localedir = v}
parser.parse(ARGV)

if dir == '' then
	print "missing base directory.\n"
	exit 1
end
if localedir == '' then
	print "missing locale directory.\n"
	exit 1
end

Dir.entries(localedir)
.select{|e| e != "." && e != ".." && File.directory?(localedir + "/" + e)}
.each{|e|
	message = JSON.load(File.read("#{localedir}/#{e}/messages.json"))
	localeCode = e.gsub(/_/, '-')
	fileName = dir + "/locale/" + localeCode + ".properties"
	content =
		"# wasavi description\n" +
		"wasavi_desc = #{message['wasavi_desc']['message']}\n"

	File.write(fileName, content)
	# print "generated: #{fileName}\n#{content}\n\n"
}
