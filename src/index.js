/** @format */

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify, Loading } from 'notiflix';
import 'bootstrap/dist/css/bootstrap.min.css';
var throttle = require('lodash.throttle');
import { fetchImage } from './fetch_api.js';

const ref = {
	gallery: document.querySelector('.gallery'),
	searchForm: document.querySelector('.search-form'),
	btnLoadmore: document.querySelector('.load-more'),
	divLoadmore: document.querySelector('.button-cont'),
	radioBtn: document.querySelector('#flexSwitchCheckDefault'),
	scrollbar: document.querySelector('.scrollbar'),
};

const paramFetch = {
	searchItem: '',
	page: 1,
	perPage: 15,
	countFoundItem: 0,
	countPage: 0,

	calcTotalPage() {
		this.countPage = Math.ceil(this.countFoundItem / this.perPage);
	},
	calcTotalItem(res) {
		this.countFoundItem = res.hits.length === 0 ? res.hits.length : res.totalHits;
	},
};

const options = {
	rootMargin: '1px',
};

const observer = new IntersectionObserver(onClickLoadmore, options);

const windowHeight = document.documentElement.clientHeight - 85;
let loadStatus = true;

ref.searchForm.addEventListener('submit', onSearchClickBtn);
ref.btnLoadmore.addEventListener('click', onClickLoadmore);
ref.radioBtn.addEventListener('change', onClickChange);
window.addEventListener('scroll', throttle(onScrollLoadMore, 300));

const $lightbox = new SimpleLightbox('.gallery a', {
	captions: true,
	captionsData: 'alt',
	captionDelay: 250,
});

function onSearchClickBtn(e) {
	e.preventDefault();

	resetParamNewSearch();

	paramFetch.searchItem = e.target.searchQuery.value;
	if (!paramFetch.searchItem) {
		Notify.warning('Search bar is empty.');
		return;
	}

	markupFetchSearchItem(paramFetch);

	e.target.searchQuery.value = '';
}

function markupFetchSearchItem() {
	Loading.dots();
	fetchImage(paramFetch)
		.then(res => {
			paramFetch.calcTotalItem(res);
			paramFetch.calcTotalPage();

			if (paramFetch.countFoundItem) {
				Notify.success(`Hooray! We found ${paramFetch.countFoundItem} images.`);
				updatePage(res);
				if (ref.radioBtn.checked && paramFetch.countFoundItem && paramFetch.countPage > 1) {
					observer.observe(ref.divLoadmore);
				}
			} else {
				Notify.info('Nothing was found according to your request.');
			}
		})
		.catch(error => {
			Notify.failure('Unable to load results. ' + error.message);
		})
		.finally(() => {
			Loading.remove(250);
			loadStatus = false;
		});
}

function onClickLoadmore(entries) {
	let intersectingBlock = false;
	if (!entries.isTrusted) {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				intersectingBlock = true;
			}
		});
	}
	if (intersectingBlock || !ref.radioBtn.checked) {
		Loading.dots();
		fetchImage(paramFetch)
			.then(res => {
				if (paramFetch.countPage <= paramFetch.page) {
					if (ref.radioBtn.checked) {
						observer.unobserve(ref.divLoadmore);
					}
					ref.btnLoadmore.classList.add('is-hidden');
					Notify.info("We're sorry, but you've reached the end of search results.");
				}
				updatePage(res);
				scrollWindow();
			})
			.catch(error => {
				observer.unobserve(ref.divLoadmore);
				Notify.failure('Unable to load results.');
			})
			.finally(() => {
				Loading.remove(350);
				loadStatus = false;
			});
	}
}

function updatePage(res) {
	paramFetch.page += 1;
	const countPage = Math.ceil(paramFetch.countFoundItem / paramFetch.perPage);
	if (countPage < paramFetch.page) {
		ref.btnLoadmore.classList.add('is-hidden');
	}
	ref.gallery.insertAdjacentHTML('beforeend', markupImg(res.hits));
	$lightbox.refresh();
	if (!ref.radioBtn.checked && countPage > paramFetch.page) {
		ref.btnLoadmore.classList.remove('is-hidden');
	}
}

function onScrollLoadMore() {
	const btnHeigth = !ref.radioBtn.checked ? 115 : 0;
	const galleryPosHeigth = ref.gallery.offsetHeight - 85;
	const currentScrollY = window.pageYOffset;
	const statusBar = (currentScrollY / (galleryPosHeigth - windowHeight + btnHeigth)) * 100;

	ref.scrollbar.style.width = `${statusBar}vw`;
}

function onClickChange() {
	const countPage = Math.ceil(paramFetch.countFoundItem / paramFetch.perPage);
	if (paramFetch.page === 1 || paramFetch.page >= countPage) {
		return;
	}
	ref.radioBtn.checked && ref.gallery.childElementCount
		? ref.btnLoadmore.classList.add('is-hidden')
		: ref.btnLoadmore.classList.remove('is-hidden');
	if (!ref.radioBtn.checked) {
		observer.unobserve(ref.divLoadmore);
	} else {
		observer.observe(ref.divLoadmore);
	}
}

function scrollWindow() {
	const { height: cardHeight } = ref.gallery.firstElementChild.getBoundingClientRect();
	window.scrollBy({
		top: cardHeight * 2,
		behavior: 'smooth',
	});
}

function markupImg(data) {
	return data
		.map(
			({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) =>
				`<li class="photo-card">
            <a href="${largeImageURL}">        
                <img src="${webformatURL}" alt="${tags}" loading="lazy" width = "100%" />
            </a>
            <div class="info">
                <p class="info-item">
                <b>Likes</b>
                ${likes}
                </p>
                <p class="info-item">
                <b>Views</b>
                ${views}
                </p>
                <p class="info-item">
                <b>Comments</b>
                ${comments}
                </p>
                <p class="info-item">
                <b>Downloads</b>
                ${downloads}
                </p>
            </div>             
        </li>`
		)
		.join('');
}

function resetParamNewSearch() {
	ref.gallery.innerHTML = '';
	paramFetch.page = 1;
	paramFetch.countFoundItem = 1;
	ref.scrollbar.style.width = `0vw`;
	ref.btnLoadmore.classList.add('is-hidden');
	observer.unobserve(ref.divLoadmore);
}
