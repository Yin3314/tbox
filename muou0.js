const appConfig = {
    _webSite: 'http://www.muoupan.top',
    _uzTag: '',
    get webSite() {
        return this._webSite;
    },
    set webSite(value) {
        this._webSite = value;
    },
    get uzTag() {
        return this._uzTag;
    },
    set uzTag(value) {
        this._uzTag = value;
    }
};

/**
 * 获取分类列表
 * @returns {Promise<string>} JSON字符串的分类列表
 */
async function getClassList() {
    let backData = {
        data: [],
        error: null
    };
    try {
        const url = `${appConfig.webSite}`;
        const res = await req(url);
        const $ = cheerio.load(res.data);
        const categories = $(".stui-header__menu li a");
        categories.each((_, el) => {
            const typeName = $(el).text().trim();
            const typeId = $(el).attr('href');
            if (typeName && typeId) {
                backData.data.push({
                    type_id: typeId,
                    type_name: typeName,
                    hasSubclass: false,
                });
            }
        });
    } catch (error) {
        backData.error = `获取分类列表失败：${error.message}`;
    }
    return JSON.stringify(backData);
}

/**
 * 获取分类视频列表
 * @param {object} args 参数对象，包含分类URL、页码、以及 UZTag
 * @returns {Promise<string>} JSON字符串的视频列表
 */
async function getVideoList(args) {
    let backData = {
        data: [],
        error: null
    };
    try {
        const url = `${appConfig.webSite}${args.url}?page=${args.page}&tag=${appConfig.uzTag}`;
        const res = await req(url);
        const $ = cheerio.load(res.data);
        const videos = $(".stui-vodlist__box");
        videos.each((_, el) => {
            const video = {
                vod_id: $(el).find("a").attr("href"),
                vod_name: $(el).find("a").attr("title"),
                vod_pic: $(el).find("img").attr("data-original"),
                vod_remarks: $(el).find(".pic-text").text().trim(),
            };
            backData.data.push(video);
        });
    } catch (error) {
        backData.error = `获取视频列表失败：${error.message}`;
    }
    return JSON.stringify(backData);
}

/**
 * 获取视频详情
 * @param {object} args 参数对象，包含视频详情URL以及 UZTag
 * @returns {Promise<string>} JSON字符串的视频详情
 */
async function getVideoDetail(args) {
    let backData = {
        data: {},
        error: null
    };
    try {
        const url = `${appConfig.webSite}${args.url}?tag=${appConfig.uzTag}`;
        const res = await req(url);
        const $ = cheerio.load(res.data);

        const videoDetail = {
            vod_id: args.url,
            vod_name: $(".stui-content__detail h1").text().trim(),
            vod_pic: $(".stui-content__thumb img").attr("data-original"),
            vod_year: "",
            vod_director: "",
            vod_actor: "",
            panUrls: []
        };

        const details = $(".stui-content__detail p");
        details.each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes("导演")) {
                videoDetail.vod_director = text.split("：")[1];
            } else if (text.includes("主演")) {
                videoDetail.vod_actor = text.split("：")[1];
            } else if (text.includes("年份")) {
                videoDetail.vod_year = text.split("：")[1];
            }
        });

        const playItems = $(".stui-content__playlist li a");
        playItems.each((_, el) => {
            videoDetail.panUrls.push($(el).attr("href"));
        });

        backData.data = videoDetail;
    } catch (error) {
        backData.error = `获取视频详情失败：${error.message}`;
    }
    return JSON.stringify(backData);
}

/**
 * 搜索视频
 * @param {object} args 参数对象，包含搜索词、页码、以及 UZTag
 * @returns {Promise<string>} JSON字符串的搜索结果
 */
async function searchVideo(args) {
    let backData = {
        data: [],
        error: null
    };
    try {
        const url = `${appConfig.webSite}/vodsearch/${args.searchWord}----------${args.page}---.html?tag=${appConfig.uzTag}`;
        const res = await req(url);
        const $ = cheerio.load(res.data);

        const results = $(".stui-vodlist__box");
        results.each((_, el) => {
            const video = {
                vod_id: $(el).find("a").attr("href"),
                vod_name: $(el).find("a").attr("title"),
                vod_pic: $(el).find("img").attr("data-original"),
                vod_remarks: $(el).find(".pic-text").text().trim(),
            };
            backData.data.push(video);
        });
    } catch (error) {
        backData.error = `搜索视频失败：${error.message}`;
    }
    return JSON.stringify(backData);
}