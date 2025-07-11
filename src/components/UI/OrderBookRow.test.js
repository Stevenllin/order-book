import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OrderBookRow from './OrderBookRow.vue';
import { OrderSide } from '../../core/enums/order/OrderSide';
import { StatusChangeEnum } from '../../core/enums/system/StatusChangeEnum';

describe('OrderBookRow', () => {
  const defaultProps = {
    quote: {
      price: 100.5,
      size: 10.25,
      total: 10.25
    },
    side: OrderSide.BUY,
    previousOrderBook: [],
    total: 100
  };

  it('should render price, size and total correctly', () => {
    const wrapper = mount(OrderBookRow, {
      props: defaultProps
    });

    expect(wrapper.text()).toContain('100.5');
    expect(wrapper.text()).toContain('10.3'); // formatNumber 默認顯示 1 位小數
  });

  it('should apply buy class when side is BUY', () => {
    const wrapper = mount(OrderBookRow, {
      props: defaultProps
    });

    expect(wrapper.find('.order-book-row').classes()).toContain('order-book-row--buy');
    expect(wrapper.find('.order-book-row').classes()).not.toContain('order-book-row--sell');
  });

  it('should apply sell class when side is SELL', () => {
    const wrapper = mount(OrderBookRow, {
      props: {
        ...defaultProps,
        side: OrderSide.SELL
      }
    });

    expect(wrapper.find('.order-book-row').classes()).toContain('order-book-row--sell');
    expect(wrapper.find('.order-book-row').classes()).not.toContain('order-book-row--buy');
  });

  it('should show up status when size increases', () => {
    const wrapper = mount(OrderBookRow, {
      props: {
        ...defaultProps,
        quote: { price: 100, size: 15, total: 15 },
        previousOrderBook: [{ price: 100, size: 10, total: 10 }]
      }
    });

    expect(wrapper.find('.order-book-row--size').classes()).toContain('order-book-row--size--up');
  });

  it('should show down status when size decreases', () => {
    const wrapper = mount(OrderBookRow, {
      props: {
        ...defaultProps,
        quote: { price: 100, size: 5, total: 5 },
        previousOrderBook: [{ price: 100, size: 10, total: 10 }]
      }
    });

    expect(wrapper.find('.order-book-row--size').classes()).toContain('order-book-row--size--down');
  });

  it('should show same status when size unchanged', () => {
    const wrapper = mount(OrderBookRow, {
      props: {
        ...defaultProps,
        quote: { price: 100, size: 10, total: 10 },
        previousOrderBook: [{ price: 100, size: 10, total: 10 }]
      }
    });

    expect(wrapper.find('.order-book-row--size').classes()).toContain('order-book-row--size--same');
  });

  it('should show background when not in previous order book (new entry)', () => {
    const wrapper = mount(OrderBookRow, {
      props: defaultProps
    });

    const style = wrapper.find('.order-book-row').attributes('style');
    expect(style).toBeTruthy();
    expect(style).toContain('background');
  });

  it('should not show background when in previous order book for buy side', () => {
    const wrapper = mount(OrderBookRow, {
      props: {
        ...defaultProps,
        quote: { price: 100, size: 10, total: 10 },
        previousOrderBook: [{ price: 100, size: 10, total: 10 }]
      }
    });

    const style = wrapper.find('.order-book-row').attributes('style');
    expect(style).toBeFalsy() || expect(style).not.toContain('background');
  });

  it('should calculate total bar width correctly', () => {
    const wrapper = mount(OrderBookRow, {
      props: {
        ...defaultProps,
        quote: { price: 100, size: 10, total: 50 },
        total: 100
      }
    });

    const totalBar = wrapper.find('.order-book-row--total-bar');
    expect(totalBar.attributes('style')).toContain('width: 50%');
  });
});
