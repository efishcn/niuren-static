function showToast(message) {
    var toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message; // Set the text content
    toast.className = "toast show";

    // After 2.5 seconds, remove the show class from DIV
    setTimeout(function () {
        toast.className = toast.className.replace("show", "");
    }, 2500);
}

/**
 * 统一的复制函数
 * @param {string|Blob} content - 要复制的内容（文本或Blob对象）
 * @param {string} type - 内容的类型（text/plain 或 text/html）
 */
async function copyToClipboard(content, type = 'text/plain') {
    if (navigator.clipboard) {
        // 优先使用 navigator.clipboard
        try {
            if (type === 'text/html' && content instanceof Blob) {
                // 复制 HTML 内容
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [type]: content
                    })
                ]);
            } else {
                // 复制纯文本内容
                await navigator.clipboard.writeText(content);
            }
            return true; // 复制成功
        } catch (err) {
            console.error('navigator.clipboard 复制失败:', err);
            // 如果 navigator.clipboard 失败，继续尝试 document.execCommand
        }
    }

    // 回退到 document.execCommand（仅支持纯文本）
    if (type === 'text/html') {
        console.error('document.execCommand 不支持复制 HTML 内容');
        return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.style.position = 'fixed'; // 避免页面滚动
    textarea.style.opacity = 0; // 隐藏 textarea
    document.body.appendChild(textarea);
    textarea.select();

    try {
        const success = document.execCommand('copy');
        if (success) {
            return true; // 复制成功
        } else {
            throw new Error('document.execCommand 复制失败');
        }
    } catch (err) {
        console.error('document.execCommand 复制失败:', err);
        return false; // 复制失败
    } finally {
        document.body.removeChild(textarea); // 清理 DOM
    }
}

jQuery(document).ready(function ($) {
    // 找到多个连续的h1标签
    var $content = $('.rmctc-content');
    var contentHtml = $content.html();

    // 使用正则匹配多个连续的h1标签
    var multiH1Regex = /(<h1[^>]*>.*?<\/h1>\s*){2,}/;

    if (multiH1Regex.test(contentHtml)) {
        // 如果找到多个连续的h1，为这些h1添加复制按钮
        var matches = contentHtml.match(multiH1Regex);
        if (matches) {
            // 使用正则表达式提取匹配的h1标签
            var h1Tags = matches[0].match(/<h1[^>]*>.*?<\/h1>/g);
            if (h1Tags) {
                h1Tags.forEach(function (h1Tag) {
                    // 使用jQuery选择器找到匹配的h1标签并添加按钮
                    $content.find('h1').filter(function () {
                        return $(this).html() === $(h1Tag).html();
                    }).each(function () {
                        const $h1 = $(this);
                        const $button = $('<button>', {
                            class: 'rmctc-copy-button rmctc-title-button',
                            text: '复制标题',
                            css: {
                                'display': 'inline-block',
                                'margin-left': '10px',
                                'vertical-align': 'middle'
                            }
                        });

                        $h1.append($button);
                    });
                });
            }
        }
    }

    // 处理所有复制按钮的点击事件
    $('.rmctc-copy-button').on('click', async function () {
        var $button = $(this);
        var copyType = $button.data('type');

        try {
            if ($button.hasClass('rmctc-title-button')) {
                // 复制单个标题
                const titleText = $(this).parent('h1').clone()    // 克隆h1元素
                    .children()                                    // 获取所有子元素
                    .remove()                                      // 移除所有子元素(包括按钮)
                    .end()                                        // 返回到h1元素
                    .text()                                       // 获取纯文本内容
                    .trim();                                      // 去除首尾空格
                const success = await copyToClipboard(titleText); // 使用统一的复制函数
                if (success) {
                    showToast(`标题复制成功：${titleText}`);
                } else {
                    showToast("标题复制失败，请重试");
                }
            } else if (copyType === 'plain') {
                // 复制纯文本内容
                var $content = $('.rmctc-content').clone();

                // 移除所有标题复制按钮
                $content.find('.rmctc-title-button').remove();

                // 创建一个隐藏的 div 来保存要复制的内容
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'fixed';
                tempDiv.style.left = '-9999px';
                tempDiv.innerHTML = $content.html();
                document.body.appendChild(tempDiv);

                // 使用 innerText 获取纯文本内容（保留换行）
                const plainText = tempDiv.innerText.trim(); // 使用 innerText 保留换行
                console.log(plainText); // 打印 plainText，检查是否包含换行符

                // 使用统一的复制函数
                const success = await copyToClipboard(plainText);
                if (success) {
                    showToast("纯文本复制成功！");
                } else {
                    showToast("纯文本复制失败，请重试");
                }

                // 清理
                document.body.removeChild(tempDiv);
            } else {
                var $content = $('.rmctc-content').clone();

                if (copyType === 'content') {
                    // 找到第一组连续的h1标签
                    let $h1s = $content.find('h1');
                    let startIndex = 0;
                    let endIndex = 0;

                    // 找到连续h1的结束位置
                    for (let i = 1; i < $h1s.length; i++) {
                        if ($h1s.eq(i).prev('h1').length === 0) {
                            break;
                        }
                        endIndex = i;
                    }

                    // 移除连续的h1标签
                    for (let i = startIndex; i <= endIndex; i++) {
                        $h1s.eq(i).remove();
                    }
                }

                // 清理样式
                $content.find('*').each(function () {
                    var $el = $(this);
                    var tagName = this.tagName.toLowerCase();

                    if (tagName === 'img') {
                        // 获取 src 属性
                        var src = $el.attr('src');

                        // 清理样式和类
                        $el.removeAttr('style').removeAttr('class');

                        // 直接写入内联样式
                        $el.attr('style', 'display: block; margin-left: auto; margin-right: auto;');

                        // 重新设置 src 属性
                        $el.attr('src', src);
                    } else if (tagName === 'a') {
                        var href = $el.attr('href');
                        $el.removeAttr('style').removeAttr('class').attr('href', href);
                    } else {
                        $el.removeAttr('style').removeAttr('class');
                    }
                });

                // 移除所有标题复制按钮
                $content.find('.rmctc-title-button').remove();

                // 移除所有的 div 标签
                $content.find('div').each(function () {
                    var $div = $(this);
                    $div.replaceWith($div.contents());
                });

                // 使用统一的复制函数复制 HTML 内容
                const type = 'text/html';
                const blob = new Blob([$content.html()], { type });
                const success = await copyToClipboard(blob, type); // 使用统一的复制函数
                if (success) {
                    showToast("内容复制成功！");
                } else {
                    showToast("内容复制失败，请重试");
                }
            }
        } catch (err) {
            console.error('复制失败:', err);
            showToast(`复制失败：${err.message}`);
        }
    });
});
