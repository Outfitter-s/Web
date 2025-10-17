import SwiperComponent from './Swiper.svelte';
import Card from './Card.svelte';

const Swiper = SwiperComponent as typeof SwiperComponent & { Card: typeof Card };
Swiper.Card = Card;

export default Swiper;
