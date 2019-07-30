# InstagramBot.js

### Description
InstagramBot is a Puppeteer-based class with some Instagram automation methods:

`signin(credentials)` - signs user with provided credentials into instagram. 

Please note: you'll get "unusual login attempt" message when you try to use `signin()` for the first time for user. It doesn't relate to human behavior imitation — to confirm it, you can just try logging to your Instagram manually using "incognito mode" of your favourite browser, and you will receive the same "unusual login attempt" message.

So it seems like it's inevitable — you just need to confirm it's you via SMS/email for the first time. Puppeteer is configured to use `userDataDir` option, so you won't need to do it every time.

`follow(username)` - follows a user by username

`unfollow(username)` - unfollows a user by username

`like(postId)` - likes an image by given media Id

`unlike(postId)` - unlikes an image by given media Id

`visitProfile(username)` - simply visits the profile of a user


### Configuration

Please check `config/config.json` — it contains all configuration options (selectors, Puppeteer args, proxy server, etc.)

Do not forget to install all dependencies:

```
$ cd instagram_puppeteer_bot
$ npm install
```
