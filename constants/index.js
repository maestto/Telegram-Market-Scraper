module.exports = {
    ebay: {
        searchResultsCountSelector: 'h1.srp-controls__count-heading',
        nextPageButtonSelector: '.pagination__next',
        productsListSelector: 'ul.srp-results',
        productInfoSelector: 'li.s-item',
        productInfo: {
            title: 'div.s-item__title',
            link: 'a.s-item__link',
            price: 'span.s-item__price',
            image: 'div.s-item__image-wrapper',
        },
        sellerInfo: {
            sellerSection: 'ul.ux-seller-section__content',
        }
    },
};