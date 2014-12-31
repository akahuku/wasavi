#!/usr/bin/ruby

require 'optparse'
require 'json'
require 'rexml/document'

dir = ''
outdir = ''
localedir = ''
ver = ''
update_url = ''

parser = OptionParser.new
parser.on('--indir directory') {|v| dir = v}
parser.on('--outdir directory') {|v| outdir = v}
parser.on('--ver string') {|v| ver = v}
parser.on('--localedir directory') {|v| localedir = v}
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

xml = REXML::Document.new(File.read("#{dir}/config.xml"))

# set the version
xml.root.add_attribute("version", ver)

# set the elements language description specified
if localedir == '' then
	localedir = "#{dir}/locales"
end
if localedir != '' then
	Dir.entries(localedir)
	.select{|e| e != "." && e != ".." && File.directory?("#{localedir}/#{e}")}
	.each{|e|
		message = JSON.load(File.read("#{localedir}/#{e}/messages.json"))
		localeCode = e.gsub(/_/, '-').downcase

		element = xml.root.add_element("description")
		element.text = message['wasavi_desc']['message']
		element.add_attribute("xml:lang", localeCode)
	}
end

# strip the elements language description NOT specified
languageDesc = REXML::XPath.match(xml, "//description[@xml:lang]").length
if languageDesc > 0 then
	xml.delete_element("//description[not(@xml:lang)]")
end

# append update-url if specified
if update_url != '' then
	REXML::XPath.match(xml, "//update-description").each do |node|
		node.add_attribute("href", update_url)
	end
end

# output
formatter = REXML::Formatters::Pretty.new
formatter.compact = true
output = StringIO.new
formatter.write(xml, output)
if outdir != '' then
	File.write("#{outdir}/config.xml", output.string)
else
	print output.string
end
