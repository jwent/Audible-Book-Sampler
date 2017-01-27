zip -r audio-player.zip *
aws lambda update-function-code --function-name AudioPlayerLambdaFunction --zip-file fileb://audio-player.zip
