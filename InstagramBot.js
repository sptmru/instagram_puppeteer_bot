'use strict';

class InstagramBot {

    constructor() {
        this.config = require('./config/config.json');
    }

    randomInteger(min, max) {
        let rand = min - 0.5 + Math.random() * (max - min + 1);
        return Math.round(rand);
    }

    async init() {
        const puppeteer = require('puppeteer');
        const fs = require('fs');

        const preloadFile = fs.readFileSync('./config/preload.js', 'utf8');

        let args = this.config.args;
        if (this.config.proxyServer) {
            args.push('--proxy-server=' + this.config.proxyServer);
        }

        this.browser = await puppeteer.launch({
            headless: false,
            args: args,
            ignoreHTTPSErrors: true,
            userDataDir: this.config.userDataDir
        });

        this.page = await this.browser.newPage();
        await this.page.evaluateOnNewDocument(preloadFile);
        await this.page.setViewport({ width: this.config.viewPort.width, height: this.config.viewPort.height });

        return true;
    }

    async isLoggedIn() {
        let profileIcon = await this.page.$(this.config.selectors.profile_icon);
        if (profileIcon !== null) {
            return true;
        } else {
            return false;
        }
    }

    async signin(credentials) {

        if (!credentials || (typeof credentials.username === undefined || typeof credentials.password === undefined)) {
            throw new Error('Username or password was not passed');
        }

        await this.page.goto(this.config.base_url, { timeout: 60000, waitUntil: 'networkidle0' });
        await this.page.waitFor(this.randomInteger(1000, 3000));

        try {
            await this.page.click(this.config.selectors.home_to_login_button);
        } catch (e) {
            return true; //already logged in
        }

        await this.page.waitFor(this.randomInteger(500, 1000));
        await Promise.all([
            this.page.waitForSelector(this.config.selectors.username_field),
            this.page.waitForSelector(this.config.selectors.password_field),
        ]);

        await this.page.click(this.config.selectors.username_field);
        await this.page.waitFor(this.randomInteger(100, 300));
        await this.page.keyboard.type(credentials.username);
        await this.page.waitFor(this.randomInteger(100, 300));
        await this.page.click(this.config.selectors.password_field);
        await this.page.waitFor(this.randomInteger(100, 300));
        await this.page.keyboard.type(credentials.password);
        await this.page.waitFor(this.randomInteger(500, 1000));
        await this.page.keyboard.press('Enter');
        await this.page.waitFor(this.randomInteger(100, 300));

        try {
            await this.page.waitForNavigation({ timeout: 15000 });
        } catch (e) {
            //we'll see incorrect login / account banned message here without page reload, so throw error here
            throw new Error("Incorrect login credentials!")
        }


        let unusualLogin = await this.page.$(this.config.selectors.unusual_login_button);

        if (unusualLogin !== null) {
            //if got 'unusual login' message - waiting for manual email/SMS confirmation before doing next steps
            await this.page.waitForNavigation();
        }

        try {
            //disabling notifications
            await this.page.click(this.config.selectors.not_now_button);
        } catch (e) {
            //do nothing
        }

        return true;
    }

    async visitProfile(profileName) {
        await this.page.goto(`${this.config.base_url}/${profileName}/`, { timeout: 60000, waitUntil: 'networkidle0' });
        await this.page.waitFor(this.randomInteger(300, 500));

        let error404 = await this.page.$(this.config.selectors.error_404);
        if (error404 !== null) {
            throw new Error(`No such profile: ${profileName}`);
        }

        return true;
    }

    async like(mediaId) {
        if (!(await this.isLoggedIn())) {
            throw new Error("Please log in first!");
        }
        await this.page.goto(`${this.config.base_url}/p/${mediaId}/`, { timeout: 60000, waitUntil: 'networkidle0' });
        await this.page.waitFor(this.randomInteger(500, 1000));

        let error404 = await this.page.$(this.config.selectors.error_404);
        if (error404 !== null) {
            throw new Error(`No such post: ${mediaId}`);
        }

        let postIsLiked = await this.page.$(this.config.selectors.post_heart_pink);

        if (postIsLiked === null) {
            await this.page.click(this.config.selectors.post_like_button);
            await this.page.waitFor(this.randomInteger(200, 300));

            let postIsLikedNow = await this.page.$(this.config.selectors.post_heart_pink);
            if (postIsLikedNow === null) {
                throw new Error(`Error while trying to like post ${mediaId}`);
            }
        } else {
            throw new Error(`Already liked post ${mediaId}`);
        }

        return true;
    }

    async unlike(mediaId) {
        if (!(await this.isLoggedIn())) {
            throw new Error("Please log in first!");
        }

        await this.page.goto(`${this.config.base_url}/p/${mediaId}/`, { timeout: 60000, waitUntil: 'networkidle0' });
        await this.page.waitFor(this.randomInteger(500, 1000));

        let error404 = await this.page.$(this.config.selectors.error_404);
        if (error404 !== null) {
            throw new Error(`No such post: ${mediaId}`);
        }

        let postIsLiked = await this.page.$(this.config.selectors.post_heart_pink);

        if (postIsLiked !== null) {
            await this.page.click(this.config.selectors.post_like_button);
            await this.page.waitFor(this.randomInteger(200, 300));

            let postIsLikedNow = await this.page.$(this.config.selectors.post_heart_pink);
            if (postIsLikedNow !== null) {
                throw new Error(`Error while trying to unlike post ${mediaId}`);
            }

        } else {
            throw new Error(`Post ${mediaId} was not liked`);
        }

        return true;
    }

    async follow(profileName) {
        if (!(await this.isLoggedIn())) {
            throw new Error("Please log in first!");
        }

        await this.visitProfile(profileName);
        await this.page.waitFor(this.randomInteger(500, 1000));

        let isNotFollowingYet = await this.page.$(this.config.selectors.user_follow_button);

        if (isNotFollowingYet) {
            await this.page.click(this.config.selectors.user_follow_button);
            await this.page.waitFor(this.randomInteger(1000, 1100));

            try {
                await this.page.waitForSelector(this.config.selectors.user_unfollow_button, { timeout: 1500 })
            } catch (e) {
                throw new Error(`Error while trying to follow profile ${profileName}`);
            }

        } else {
            throw new Error(`Already following profile ${profileName}`);
        }

        return true;
    }

    async unfollow(profileName) {
        if (!(await this.isLoggedIn())) {
            throw new Error("Please log in first!");
        }

        await this.visitProfile(profileName);
        await this.page.waitFor(this.randomInteger(500, 1000));

        let isFollowingAlready = await this.page.$(this.config.selectors.user_unfollow_button);

        if (isFollowingAlready) {
            await this.page.click(this.config.selectors.user_unfollow_button);
            await this.page.waitForSelector(this.config.selectors.user_unfollow_confirm_button);
            await this.page.waitFor(this.randomInteger(500, 1000));
            await this.page.click(this.config.selectors.user_unfollow_confirm_button);
            await this.page.waitFor(this.randomInteger(200, 300));

            try {
                await this.page.waitForSelector(this.config.selectors.user_follow_button, { timeout: 1500 })
            } catch (e) {
                throw new Error(`Error while trying to unfollow profile ${profileName}`);
            }


        } else {
            throw new Error(`We do not follow profile ${profileName}`);
        }

        return true;
    }

    async closeBrowser() {
        await this.browser.close();

        return true;
    }

}

module.exports = InstagramBot;