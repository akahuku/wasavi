#!/usr/bin/ruby

require 'optparse'
require 'json'
require 'rexml/document'

dir = ''
outdir = ''
localedir = ''
ver = ''
strip_update_url = false

parser = OptionParser.new
parser.on('--indir directory') {|v| dir = v}
parser.on('--outdir directory') {|v| outdir = v}
parser.on('--ver string') {|v| ver = v}
parser.on('--localedir directory') {|v| localedir = v}
parser.on('--strip-update-url') {strip_update_url = true}
parser.parse(ARGV)

if dir == '' then
	print "missing base directory.\n"
	exit 1
end
if ver == '' then
	print "missing version.\n"
	exit 1
end

xml = REXML::Document.new(File.read("#{dir}/install.rdf"))

# set the version
xml.elements["//em:version"].text = ver

# set the elements language description specified
if localedir != '' then
	productName = xml.elements["/RDF/Description/em:name"].text

	Dir.entries(localedir)
	.select{|e| e != "." && e != ".." && File.directory?("#{localedir}/#{e}")}
	.each{|e|
		message = JSON.load(File.read("#{localedir}/#{e}/messages.json"))
		localeCode = e.gsub(/_/, '-')

		localized = xml.elements["//Description[1]"].add_element("em:localized")
		desc = localized.add_element("Description")
		desc.add_element("em:locale").text = localeCode
		desc.add_element("em:name").text = productName
		desc.add_element("em:description").text = message['wasavi_desc']['message']
	}
end

# strip some attributes
if strip_update_url then
	xml.delete_element("//em:updateURL")
end

# output
formatter = REXML::Formatters::Pretty.new
formatter.compact = true
output = StringIO.new
formatter.write(xml, output)
if outdir != '' then
	File.write("#{outdir}/install.rdf", output.string)
else
	print output.string
end
