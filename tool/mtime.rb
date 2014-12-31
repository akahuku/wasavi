#!/usr/bin/ruby

require 'optparse'

dir = ''
base = ''
out = ''

parser = OptionParser.new
parser.on('--dir directory') {|v| dir = v}
parser.on('--base file') {|v| base = v}
parser.on('--out file') {|v| out = v}
parser.parse(ARGV)

if dir == '' then
	print "missing directory.\n"
	exit 1
end
print "directory: #{dir}\n"

if base != '' then
	begin
		base = File.mtime(base)
	rescue
		base = 0
	end
else
	base = 0
end

if base.instance_of?(Time) then
	print "base timestamp: #{base.strftime("%Y-%m-%d %H:%M:%S")}\n"
else
	print "base timestamp: (inavailable)\n"
end

latest = {
	time: Time.at(0),
	path: ''
}
def loop (path)
	Dir.entries(path).each do |entry|
		next if entry == "." || entry == ".."
		next if /\.sw.$/ =~ entry

		p = path + "/" + entry
		if File.directory?(p) then
			loop(p, &Proc.new{|it| yield(it)})
		else
			yield(p)
		end
	end
end
loop(dir) do |f|
	mt = File.mtime(f)
	if mt > latest[:time] then
		latest[:time] = mt
		latest[:path] = f
	end
	if base.instance_of?(Time) && mt > base then
		print "newer: #{mt.strftime("%Y-%m-%d %H:%M:%S")}\t#{f}\n"
	end
end

if out == '' then
	print "latest timestamp: "
	print latest[:time].strftime("%Y-%m-%d %H:%M:%S")
	print "\t", latest[:path], "\n"
else
	FileUtils.touch(out, latest[:time])
end
