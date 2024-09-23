class UrlManager {
    constructor() {
        this.root = document.getElementById("root");
        this.urlInput = document.querySelector("#url");
        this.pastUrlSelectContainer = document.querySelector(".past_url");
        this.setPastUrlSelect();
    }

    async onSubmit() {
        const url = this.urlInput.value;
        if (url === "") {
            this.cleanUrlInput();
            return;
        }
        if (!this.isValidUrl(url)) {
            this.cleanUrlInput();
            return;
        }
        if (this.getAllDisplayUrls().includes(url)) {
            console.log("this is already displayed");
            this.cleanUrlInput();
            return;
        }
        const { ogp, favicon } = await this.getOgp(url);
        this.displayOgpContainer(ogp, favicon);
        if (!this.isInPastUrls(url)) {
            this.updatePastUrlSelect(url);
        }
        this.saveUrlToLocalStorage(url);
        this.cleanUrlInput();
    }

    onDelete() {
        localStorage.removeItem("pastUrls");
        console.log(localStorage.getItem("pastUrls"));
        this.disposePastUrlSelect();
    }

    async getOgp(url) {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const html = await response.text();
        const dom = new DOMParser().parseFromString(html, "text/html");

        const ogp = [...dom.head.children]
            .filter(
                (el) =>
                    el.tagName === "META" &&
                    el.getAttribute("property")?.startsWith("og:")
            )
            .reduce((acc, el) => {
                acc[el.getAttribute("property")] = el.getAttribute("content");
                return acc;
            }, {});

        const favicon =
            [...dom.head.children]
                .filter(
                    (el) =>
                        el.tagName === "LINK" &&
                        (el.getAttribute("rel") === "icon" ||
                            el.getAttribute("rel") === "shortcut icon")
                )
                .map((el) => el.getAttribute("href"))[0] || null;

        return { ogp, favicon };
    }

    displayOgpContainer(ogp, favicon) {
        const {
            "og:description": description,
            "og:image": imageSrc,
            "og:title": title,
            "og:url": pageUrl,
        } = ogp;

        const newContainer = document.createElement("a");
        newContainer.href = pageUrl;
        newContainer.classList.add("container");

        const faviconTag = document.createElement("img");
        faviconTag.src = favicon;
        faviconTag.classList.add("favicon");

        const titleTag = document.createElement("h2");
        titleTag.innerText = title;

        const imageTag = document.createElement("img");
        imageTag.src = imageSrc;

        const descriptionTag = document.createElement("p");
        descriptionTag.innerText = description;

        newContainer.append(faviconTag, titleTag, imageTag, descriptionTag);
        this.root.prepend(newContainer);
    }

    saveUrlToLocalStorage(url) {
        const pastUrls = JSON.parse(localStorage.getItem("pastUrls")) || [];
        if (!this.isInPastUrls(url)) {
            const newPastUrls = [url, ...pastUrls];
            localStorage.setItem("pastUrls", JSON.stringify(newPastUrls));
            console.log("pastUrls is updated!", newPastUrls);
        } else {
            console.log("url is already in pastUrls!");
        }
    }

    isInPastUrls(url) {
        const pastUrls = JSON.parse(localStorage.getItem("pastUrls")) || [];
        return pastUrls.includes(url);
    }

    getAllDisplayUrls() {
        return [...document.querySelectorAll(".container")].map(
            (container) => container.href
        );
    }

    setPastUrlSelect() {
        const pastUrls = JSON.parse(localStorage.getItem("pastUrls")) || [];
        pastUrls.forEach((pastUrl) => {
            const newPastUrlSelect = document.createElement("p");
            newPastUrlSelect.innerText = pastUrl;
            newPastUrlSelect.classList.add("past_url__item");
            newPastUrlSelect.addEventListener("click", () => {
                this.urlInput.value = pastUrl;
            });
            this.pastUrlSelectContainer.appendChild(newPastUrlSelect);
        });
    }

    disposePastUrlSelect() {
        [...document.querySelectorAll(".past_url__item")].forEach((item) =>
            item.remove()
        );
    }

    updatePastUrlSelect(newUrl) {
        const newPastUrlSelect = document.createElement("p");
        newPastUrlSelect.innerText = newUrl;
        newPastUrlSelect.classList.add("past_url__item");
        newPastUrlSelect.addEventListener("click", () => {
            this.urlInput.value = newUrl;
        });
        this.pastUrlSelectContainer.appendChild(newPastUrlSelect);
    }

    cleanUrlInput() {
        this.urlInput.value = "";
    }
    isValidUrl(url) {
        // URL（https・http）の正規表現
        let regex = new RegExp(
            "^(https?:\\/\\/)?" +
                "(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}" +
                "(\\/[-a-z\\d%_.~+]*)*",
            "i"
        );
        if (regex.test(url)) {
            return true;
        } else {
            return false;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const urlManager = new UrlManager();

    document
        .querySelector("#submit")
        .addEventListener("click", () => urlManager.onSubmit());
    document
        .querySelector("#clear")
        .addEventListener("click", () => urlManager.cleanUrlInput());
    document
        .querySelector("#delete")
        .addEventListener("click", () => urlManager.onDelete());
});
