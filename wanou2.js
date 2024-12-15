const appConfig = {
    _webSite: 'https://www.wogg.net',
    /**
     * 网站主页，uz 调用每个函数前都会进行赋值操作
     * 如果不想被改变 请自定义一个变量
     */
    get webSite() {
        return this._webSite  // 获取当前网站的 URL
    },
    set webSite(value) {
        this._webSite = value  // 设置网站的 URL
    },

    _uzTag: '',
    /**
     * 扩展标识，初次加载时，uz 会自动赋值，请勿修改
     * 用于读取环境变量
     */
    get uzTag() {
        return this._uzTag  // 获取扩展标识
    },
    set uzTag(value) {
        this._uzTag = value  // 设置扩展标识
    },
}

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {Promise<RepVideoClassList>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()  // 创建返回结果的实例
    backData.data = [  // 模拟获取的分类数据
        {
            type_id: '1',
            type_name: '动作片',
            hasSubclass: false,
        },
        {
            type_id: '2',
            type_name: '喜剧片',
            hasSubclass: false,
        },
        {
            type_id: '3',
            type_name: '爱情片',
            hasSubclass: false,
        },
        {
            type_id: '4',
            type_name: '科幻片',
            hasSubclass: false,
        },
        {
            type_id: '5',
            type_name: '纪录片',
            hasSubclass: false,
        },
    ]
    return JSON.stringify(backData)  // 返回分类列表数据的 JSON 格式
}

async function getSubclassList(args) {
    let backData = new RepVideoSubclassList()  // 创建子类返回数据的实例
    return JSON.stringify(backData)  // 返回子类数据的 JSON 格式
}

async function getSubclassVideoList(args) {
    var backData = new RepVideoList()  // 创建视频列表返回数据的实例
    return JSON.stringify(backData)  // 返回视频列表数据的 JSON 格式
}

/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function getVideoList(args) {
    var backData = new RepVideoList()  // 创建返回视频列表的实例
    let url =
        UZUtils.removeTrailingSlash(appConfig.webSite) +  // 去掉网址末尾的斜杠并拼接
        `/index.php/vod/show/id/${args.url}/page/${args.page}.html`  // 构建视频列表页面的 URL

    try {
        const pro = await req(url)  // 发起 GET 请求并等待响应
        backData.error = pro.error  // 如果请求出错，将错误信息存入返回数据的 error 字段
        let videos = []  // 创建空数组，用于存储解析后的视频信息

        if (pro.data) {  // 如果请求成功并返回了数据
            const $ = cheerio.load(pro.data)  // 使用 cheerio 解析返回的 HTML 数据
            let vodItems = $('#main .module-item')  // 选择所有视频项

            vodItems.each((_, e) => {  // 遍历每个视频项并提取视频信息
                let videoDet = new VideoDetail()  // 创建新的 VideoDetail 实例
                videoDet.vod_id = $(e).find('.module-item-pic a').attr('href')  // 提取视频 ID
                videoDet.vod_name = $(e).find('.module-item-pic img').attr('alt')  // 提取视频名称
                videoDet.vod_pic = $(e).find('.module-item-pic img').attr('data-src')  // 提取视频缩略图链接
                videoDet.vod_remarks = $(e).find('.module-item-text').text()  // 提取视频的备注信息
                videoDet.vod_year = $(e).find('.module-item-caption span').first().text()  // 提取视频的年份
                videos.push(videoDet)  // 将视频信息加入到数组中
            })
        }
        backData.data = videos  // 将解析得到的视频信息存储到返回数据中
    } catch (error) {
        // 捕获请求或数据解析中的错误
    }
    return JSON.stringify(backData)  // 返回视频列表的 JSON 格式
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {Promise<RepVideoDetail>}
 */
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()  // 创建返回视频详情的实例
    try {
        let webUrl = UZUtils.removeTrailingSlash(appConfig.webSite) + args.url  // 构建视频详情页面的 URL
        let pro = await req(webUrl)  // 发起请求，获取视频详情页面的数据

        backData.error = pro.error  // 如果请求出错，将错误信息存入返回数据的 error 字段
        let proData = pro.data  // 获取返回的数据
        if (proData) {  // 如果返回数据有效
            const $ = cheerio.load(proData)  // 使用 cheerio 解析 HTML 数据
            let vodDetail = new VideoDetail()  // 创建一个新的 VideoDetail 实例，用于存储视频详情
            vodDetail.vod_id = args.url  // 设置视频 ID
            vodDetail.vod_name = $('.page-title')[0].children[0].data  // 提取视频名称
            vodDetail.vod_pic = $($('.mobile-play')).find('.lazyload')[0].attribs['data-src']  // 提取视频封面图

            let video_items = $('.video-info-itemtitle')  // 获取视频信息项

            for (const item of video_items) {  // 遍历每个视频信息项并提取数据
                let key = $(item).text()  // 获取信息项的标题
                let vItems = $(item).next().find('a')  // 获取下一个兄弟元素中的所有链接项
                let value = vItems
                    .map((i, el) => {
                        let text = $(el).text().trim()  // 提取并去除文本中的空白字符
                        return text ? text : null  // 只返回非空的文本
                    })
                    .get()  // 将 jQuery 对象转为普通数组
                    .filter(Boolean)  // 过滤掉空值
                    .join(', ')  // 用逗号连接所有文本

                if (key.includes('剧情')) {
                    vodDetail.vod_content = $(item).next().find('p').text().trim()  // 提取剧情描述
                } else if (key.includes('导演')) {
                    vodDetail.vod_director = value.trim()  // 提取导演信息
                } else if (key.includes('主演')) {
                    vodDetail.vod_actor = value.trim()  // 提取主演信息
                }
            }

            const panUrls = []  // 创建一个数组，用于存储视频的分享链接
            let items = $('.module-row-info')  // 获取所有分享链接的条目
            for (const item of items) {
                let shareUrl = $(item).find('p')[0].children[0].data  // 提取分享链接
                panUrls.push(shareUrl)  // 将分享链接加入到数组中
            }
            vodDetail.panUrls = panUrls  // 设置视频的分享链接到 videoDetail 中
            console.log(panUrls)  // 输出分享链接到控制台

            backData.data = vodDetail  // 将视频详情存储到返回数据中
        }
    } catch (error) {
        backData.error = '获取视频详情失败' + error  // 如果发生错误，记录错误信息
    }

    return JSON.stringify(backData)  // 返回视频详情的 JSON 格式
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {Promise<RepVideoPlayUrl>}
 */
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()  // 创建返回视频播放地址的实例
    return JSON.stringify(backData)  // 返回视频播放地址的 JSON 格式（目前为空）
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function searchVideo(args) {
    var backData = new RepVideoList()  // 创建返回视频列表的实例
    try {
        let searchUrl = `${UZUtils.removeTrailingSlash(appConfig.webSite)}/index.php/vod/search/page/${args.page}/wd/${args.searchWord}.html`  // 构建搜索 URL
        let repData = await req(searchUrl)  // 发起搜索请求
        const $ = cheerio.load(repData.data)  // 解析返回的数据
        let