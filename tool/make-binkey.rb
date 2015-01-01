#!/usr/bin/ruby

require 'optparse'
require 'openssl'
require 'base64'

# @see https://gist.github.com/nono/2995118
class BF < Struct.new(:key)
	def encrypt (str)
		enc = OpenSSL::Cipher.new('bf-ecb').encrypt
		enc.padding = 0
		enc.key = key.slice(0, 16)

		str += "\x00" * ((8 - (str.bytesize % 8)) % 8)
		binary_data = ""
		binary_data << enc.update(str)
		binary_data << enc.final
		binary_data
	end
	def decrypt (binary_data)
		dec = OpenSSL::Cipher.new('bf-ecb').decrypt()
		dec.padding = 0
		dec.key = key.slice(0, 16)

		str = ""
		str << dec.update(binary_data)
		str << dec.final
		str.force_encoding(Encoding::BINARY)
		str.gsub(/\x00+$/, '')
	end
end

keyfile = ''
srcfile = ''
dstfile = ''
verbose = 0

parser = OptionParser.new
parser.on('--key file') {|v| keyfile = v}
parser.on('--src file') {|v| srcfile = v}
parser.on('--dst file') {|v| dstfile = v}
parser.on('--verbose') {verbose += 1}
parser.parse(ARGV)

if keyfile == '' then
	print "missing key file.\n"
	exit 1
end
print "key file: #{keyfile}\n" if verbose > 0

if srcfile == '' then
	print "missing source file.\n"
	exit 1
end
print "source file: #{srcfile}\n" if verbose > 0
print "destination file: #{dstfile}\n" if verbose > 0

#
# load the key
#

begin
	key = File.read(keyfile, :encoding => Encoding::BINARY)
rescue
	print "cannot read the key file: #{keyfile}\n"
	exit 1
end
print "key:\n#{key}\n" if verbose > 1

key = Digest::SHA1.hexdigest(key)
print "sha1 of key: #{key}\n" if verbose > 0

#
# load the content
#

begin
	content = File.read(srcfile, :encoding => Encoding::BINARY)
rescue
	print "cannot read the source file: #{srcfile}\n"
	exit 1
end
if verbose > 0 then
	print "length of source content: #{content.bytesize} bytes\n"
	print "encoding of source content: #{content.encoding}\n"
	print "source: #{content}\n" if verbose > 1
end

#
# make binkey
#

bf = BF.new(key)
content_crypted = bf.encrypt(content)
content_decrypted = bf.decrypt(content_crypted)
if content == content_decrypted then
	print "encryption succeeded\n" if verbose > 0
else
	print "*** !!! ***\n"
	exit 1
end
content_crypted = Base64.strict_encode64(content_crypted)

#
# output
#

if dstfile != '' then
	File.write(dstfile, content_crypted)
	print "crypted:\n#{content_crypted}\n" if verbose > 1
else
	print "\n*** result ***\n"
	print content_crypted
end

