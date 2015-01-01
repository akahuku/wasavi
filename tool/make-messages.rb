#!/usr/bin/ruby

require 'optparse'
require 'json'

$basedir = ''
$echo_only = false
$plurals = {}

def get_id (message)
	message
		.downcase
		.gsub(/\{(\d+)\}/, '@\1')
		.gsub(/\{(\w+):\d+\}/) {
			id = "_plural_#{$1}"
			if !$plurals.key?(id) then
				$plurals[id] = {
					message: "#{$1}s"
				}
				$plurals["#{$id}@one"] = {
					message: $1
				}
			end
			return $1
		}
		.gsub(/[^A-Za-z0-9_@ ]/, '')
		.gsub(/ +/, '_')
end

def build_base_message (messages, file)
	result = true
	line_number = 1
	File.open(file) do |f|
		f.each do |line|
			if line =~ /\b_\(\s*'((\\'|[^'])+)'/ then
				message = $1.gsub("\\'", "'")
				id = get_id(message)
				if messages.key?(id) then
					if messages[id]["description"] != message then
						print "\n*** ID conflict! ***\n"
						print "\t   line number: #{line_number}\n"
						print "\t            id: #{id}\n"
						print "\tstored message: #{messages[id]["description"]}\n"
						print "\t   new message: #{message}\n"
						result = false
					end
				else
					messages[id] = {
						"message" => message,
						"description" => message
					}
				end
			end
			line_number += 1
		end
	end
	return result
end

def update_localized_messages (messages)
	dir = "#{$basedir}/_locales/"
	Dir.entries(dir)
	.select{|e| e != "." && e != ".." && File.directory?("#{dir}/#{e}")}
	.each{|e|
		next if e == "en_US"
		path = "#{dir}/#{e}/messages.json"
		next if !File.exists?(path)
		update_localized_message(messages, e, path)
	}
end

def update_localized_message (messages, locale, path)
	dst_text = File.read(path, :encoding => Encoding::UTF_8)
	dst = JSON.load(dst_text)
	result = {}
	new_keys = []

	messages.each do |key, value|
		if dst.key?(key) then
			result[key] = dst[key]
			result[key]["description"] = messages[key]["description"] if messages[key].key?("description")
		else
			result[key] = messages[key]
			new_keys << key
		end
	end

	result = JSON.pretty_generate(result)
	if result == dst_text then
		print "#{locale}: no changes.\n"
	else
		if $echo_only then
			print "\nlocale #{locale}:\n"
			print result
			print "\n"
		else
			File.write(path, result)
		end

		print "New message keys for #{locale}:"
		if new_keys.length > 0 then
			print "\n\t#{new_keys.join("\n\t")}\n"
		else
			print " nothing.\n"
		end
	end
end

def ksort (hash)
	result = {}

	hash.keys.sort.each do |key|
		result[key] = hash[key]
	end

	return result
end

def parse_args ()
	files = []

	parser = OptionParser.new
	parser.on('--indir directory') {|v| $basedir = v}
	parser.on('--echo') {$echo_only = true}
	parser.parse!(ARGV)

	ARGV.each do |arg|
		if File.exists?(arg) then
			files << arg
			next
		end

		arg = "#{$basedir}/#{arg}"
		if File.exists?(arg) then
			files << arg
			next
		end
	end

	if files.length == 0 then
		print "file not specified. stop.\n"
		exit 1
	end

	return files
end

def main (files)
	messages = {}

	files.each do |file|
		print "reading: #{file}\n"
		if !build_base_message(messages, file) then
			messages = nil
			break
		end
	end

	if messages then
		messages = ksort(messages)

		dir = "#{$basedir}/_locales/"
		extension_info = JSON.load(File.read("#{dir}/core.json", :encoding => Encoding::UTF_8))
		plural_rule = JSON.load(File.read("#{dir}/plural_rule.json", :encoding => Encoding::UTF_8))

		messages = extension_info
			.merge(plural_rule)
			.merge($plurals)
			.merge(messages)
		messages.each do |key, value|
			if value.key?("description") then
				messages[key]["description"] = messages[key]["message"]
			end
		end

		update_localized_messages(messages)

		messages = JSON.pretty_generate(messages)

		if $echo_only then
			print "\nlocale en_US:\n"
			print messages
			print "\n"
		else
			File.write("#{dir}/en_US/messages.json", messages)
		end

		print "done.\n"
	end
end

main(parse_args)
