#!/usr/bin/env ruby
# Export only public iOS OAuth settings; native client IDs are not secrets.
require_relative '../../node_modules/react-native-config/ios/ReactNativeConfig/ReadDotEnv'
root = File.expand_path('../..', __dir__)
{ 'Debug' => '.env', 'Release' => '.env.production' }.each do |configuration, filename|
  ENV['ENVFILE'] = filename
  values, = read_dot_env(root)
  client = values.fetch('GOOGLE_IOS_CLIENT_ID', '').strip
  scheme = client.empty? ? '' : "com.googleusercontent.apps.#{client.delete_suffix('.apps.googleusercontent.com')}"
  File.write(File.join(root, "ios/Google.#{configuration}.generated.xcconfig"), "GOOGLE_IOS_URL_SCHEME=#{scheme}\n")
end
