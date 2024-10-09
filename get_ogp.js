document.addEventListener("DOMContentLoaded", () => {
    setPastUrlSelect();
    setModalClickEvent();
});

async function onSubmit() {
    usingLoadingIcon(true);
    deleteError();
    const url = document.getElementById("url").value;
    if (url === "") {
        showError("URLを入力してください");
        return finishOnSubmit();
    }
    if (!isValidUrl(url)) {
        showError("URL以外が指定されています");
        return finishOnSubmit();
    }
    if (getAllDisplayUrls().indexOf(url) !== -1) {
        console.log("this is already displayed");
        showError(`入力されたURL(${url})のOGPはすでに表示されています。`);
        return finishOnSubmit();
    }
    getOgp(url)
        .then(({ ogp, favicon }) => {
            displayOgpContainer(ogp, favicon);
            if (!isInPastUrls(url)) {
                updatePastUrlSelect(url);
            }
            saveUrlToLocalStrage(url);
        })
        .catch((err) => {
            console.error(`errorが発生しました：${err}`);
            showError("URLからOGPを取得できませんでした");
        })
        .finally(() => {
            finishOnSubmit();
            return;
        });
}
function onDelete() {
    displayDeleteCheckModal();
}

async function getOgp(url) {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    return fetch(proxyUrl)
        .then((response) => response.text())
        .then((html) => new DOMParser().parseFromString(html, "text/html"))
        .then((dom) => {
            // OGPの取得
            const ogp = [...dom.head.children]
                .filter(
                    (element) =>
                        element.tagName === "META" &&
                        element.getAttribute("property")?.startsWith("og:")
                )
                .reduce((ogp, element) => {
                    ogp[element.getAttribute("property")] =
                        element.getAttribute("content");
                    return ogp;
                }, {});

            // Faviconの取得
            const favicon =
                [...dom.head.children]
                    .filter(
                        (element) =>
                            element.tagName === "LINK" &&
                            (element.getAttribute("rel") === "icon" ||
                                element.getAttribute("rel") === "shortcut icon")
                    )
                    .map((element) => element.getAttribute("href"))[0] || null;
            // 結果を返す
            return { ogp, favicon };
        });
}

function displayOgpContainer(ogp, favicon) {
    const description = ogp["og:description"];
    const imageSrc = ogp["og:image"];
    const title = ogp["og:title"];
    const type = ogp["og:type"];
    const pageUrl = ogp["og:url"];

    if (!title || !imageSrc) {
        throw new Error("OGPがありません");
    }

    let root = document.getElementById("root");

    let newFaviconTag = document.createElement("img");
    newFaviconTag.src = favicon;
    newFaviconTag.classList.add("favicon");

    let newImageTag = document.createElement("img");
    newImageTag.src = imageSrc;

    let titleTag = document.createElement("h2");
    titleTag.innerText = title;

    let descriptionTag = document.createElement("p");
    descriptionTag.innerText = description;

    let newContainer = document.createElement("a");
    newContainer.href = pageUrl;
    newContainer.classList.add("container");
    newContainer.appendChild(newFaviconTag);
    newContainer.appendChild(titleTag);
    newContainer.appendChild(newImageTag);
    newContainer.appendChild(descriptionTag);
    root.prepend(newContainer);
}

function saveUrlToLocalStrage(url) {
    /* 過去に入力したurlを検索の選択肢として保持 */
    let pastUrls = JSON.parse(localStorage.getItem("pastUrls"));
    if (pastUrls) {
    } else {
        console.log("pastUrls is empty");
        pastUrls = [];
    }
    if (!isInPastUrls(url)) {
        let newPastUrls = [url, ...pastUrls];
        localStorage.setItem("pastUrls", JSON.stringify(newPastUrls));
        console.log("pastUrls is updated!");
        console.log(newPastUrls);
    } else {
        console.log("url is already in pastUrls!");
    }
}
function isInPastUrls(url) {
    let pastUrls = JSON.parse(localStorage.getItem("pastUrls"));
    if (pastUrls) {
        if (pastUrls.indexOf(url) === -1) {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
}

function getAllDisplayUrls() {
    contaienrs = document.querySelectorAll(".container");
    let allDisplayUrls = [];
    contaienrs.forEach((container) => {
        if (allDisplayUrls.indexOf(container.href) === -1) {
            allDisplayUrls.push(container.href);
        }
    });
    console.log(allDisplayUrls);
    return allDisplayUrls;
}

function setPastUrlSelect() {
    let pastUrls = JSON.parse(localStorage.getItem("pastUrls"));
    const setPastUrlSelectContainer = document.querySelector(".past_url");
    const urlInput = document.querySelector("#url");
    if (pastUrls) {
        pastUrls.forEach((pastUrl) => {
            let newPastUrlSelect = document.createElement("p");
            newPastUrlSelect.innerText = pastUrl;
            newPastUrlSelect.classList.add("past_url__item");
            // クリックするとinputタグに値を挿入する
            newPastUrlSelect.addEventListener("click", () => {
                urlInput.value = pastUrl;
            });
            setPastUrlSelectContainer.appendChild(newPastUrlSelect);
        });
    }
}

function disposePastUrlSelect() {
    pastUrlSelects = document.querySelectorAll(".past_url__item");
    pastUrlSelects.forEach((pastUrlSelect) => {
        pastUrlSelect.remove();
    });
}
function updatePastUrlSelect(newUrl) {
    const setPastUrlSelectContainer = document.querySelector(".past_url");
    let newPastUrlSelect = document.createElement("p");
    newPastUrlSelect.innerText = newUrl;
    newPastUrlSelect.classList.add("past_url__item");
    const urlInput = document.querySelector("#url");
    // クリックするとinputタグに値を挿入する
    newPastUrlSelect.addEventListener("click", () => {
        urlInput.value = newUrl;
    });
    setPastUrlSelectContainer.appendChild(newPastUrlSelect);
}

function cleanUrlInput() {
    const urlInput = document.querySelector("#url");
    urlInput.value = "";
}

function setModalClickEvent() {
    const modalCancel = document.querySelector("#modal-cancel");
    const modalComfirm = document.querySelector("#modal-comfirm");
    modalCancel.addEventListener("click", () => {
        hiddenDeleteCheckModal();
    });
    modalComfirm.addEventListener("click", () => {
        deleteComplete();
    });
}

function displayDeleteCheckModal() {
    const checkModal = document.querySelector(".modal__delete-check");
    const checkModalMask = document.querySelector(".modal__delete-check--mask");
    checkModal.style.display = "flex";
    checkModalMask.style.display = "flex";
}
function hiddenDeleteCheckModal() {
    const checkModal = document.querySelector(".modal__delete-check");
    const checkModalMask = document.querySelector(".modal__delete-check--mask");
    checkModal.style.display = "none";
    checkModalMask.style.display = "none";
    console.log("削除はキャンセルされました");
}

function deleteComplete() {
    localStorage.removeItem("pastUrls");
    console.log(localStorage.getItem("pastUrls"));
    disposePastUrlSelect();
    console.log("履歴は削除されました");
    hiddenDeleteCheckModal();
}

function usingLoadingIcon(is_to_display) {
    const regularIcon = document.querySelector(".regular");
    const loadingIcon = document.querySelector(".loading");
    if (is_to_display) {
        regularIcon.style.display = "none";
        loadingIcon.style.display = "inline-block";
    } else {
        regularIcon.style.display = "inline-block";
        loadingIcon.style.display = "none";
    }
}

function finishOnSubmit() {
    cleanUrlInput();
    usingLoadingIcon(false);
}

function showError(error) {
    const errorContainer = document.querySelector(".error__container");
    const showErrorTag = document.querySelector("#show_error");
    const errorCloseBtn = document.querySelector("#error_close_btn");
    errorContainer.style.display = "flex";
    showErrorTag.innerText = error;
    errorCloseBtn.addEventListener("click", () => {
        deleteError();
    });
}

function deleteError() {
    const errorContainer = document.querySelector(".error__container");
    const showErrorTag = document.querySelector("#show_error");
    showErrorTag.innerText = "";
    errorContainer.style.display = "none";
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
