'use strict'

class List {
  constructor (data) {
    this._data = data
  }

  /**
   * Fetch data from server
   * @param {Object} params
   * @param {string|URL} params.url
   * @param {string[]=} params.fields
   * @param {Object=} params.filters
   * @param {string[]=} params.sort
   */
  async fetch ({ filters, fields, sort, url }) {
    let target = url
    if (typeof url === 'string') {
      target = url.startsWith('http')
        ? new URL(url)
        : new URL(url, window.location.origin)
    }

    target.searchParams.append('fields', fields.join(','))
    target.searchParams.append('sort', sort.join(','))
    Object.keys(filters).forEach(
      key => target.searchParams.append(key, filters[key]))

    const oldData = [...this._data]
    this._data = await fetch(target)
      .then(res => res.json())
      .then(data => data.results)
      .catch(e => {
        console.log(e)
        return oldData
      })

    return this
  }

  normalize (handler) {
    this._data = handler.call(this, this._data)
    return this
  }

  group (handler) {
    this._groups = Array.from(handler.call(this, this._data))
    return this
  }

  tmpl (name) {
    return {
      ul: content => `<ul class="list">${content}</ul>`,
      header: content => `<h2 class="list__header">${content}</h2>`,
      li: content => `<li class="list__item">${content}</li>`,
      name: content => `<div class="name">${content}</div>`,
      first: content => `<span class="name__first">${content}</span>`,
      last: content => `<span class="name__last">${content}</span>`
    }[name]
  }

  /**
   * Build a DOM representation for the current list
   * @param {*[]} [data] - The data for render
   * @param {Map} [groups] - Groups for splitting list
   */
  render (parent, data = this._data, groups = this._groups) {
    parent.innerHTML = this.tmpl('ul')(groups.map(([name, indexes]) => {
      const header = this.tmpl('header')(name)
      const list = this.tmpl('ul')(indexes.map(index => {
        const user = data[index]
        const first = this.tmpl('first')(user.first)
        const last = this.tmpl('last')(user.last)
        const name = this.tmpl('name')(`${first} ${last}`)
        return this.tmpl('li')(name)
      }).join(''))
      return this.tmpl('li')(`${header}${list}`)
    }).join(''))
  }
}

new List([
  { name: 'Остап Бендер' },
  { name: 'Игнат Делюгин' },
  { name: 'Максим Дергачёв' },
  { name: 'Петр Дуров' },
  { name: 'Иван Иванов' },
  { name: 'Сергей Иванов' },
  { name: 'Ольга Ивушина' }
])
  .normalize(data => data.map(item => {
    const [first, last] = item.name.split(' ')
    return { first, last }
  }))
  .group(data => data.reduce((acc, item, i, arr) => {
    const char = item.last[0].toUpperCase()
    return acc.set(char, [...(acc.get(char) || []), i])
  }, new Map()))
  .render(document.getElementById('example1'))

new List([
  { name: 'Остап Бендер', debt: 100 },
  { name: 'Игнат Делюгин', debt: 200 },
  { name: 'Максим Дергачёв', debt: 200 },
  { name: 'Петр Дуров', debt: 300 },
  { name: 'Иван Иванов', debt: 300 },
  { name: 'Сергей Иванов', debt: 300 },
  { name: 'Ольга Ивушина', debt: 400 }
])
  .normalize(data => data.map(item => {
    const [first, last] = item.name.split(' ')
    return { first, last, debt: item.debt }
  }))
  .group(data => data.reduce((acc, item, i, arr) => {
    return acc.set(item.debt, [...(acc.get(item.debt) || []), i])
  }, new Map()))
  .render(document.getElementById('example2'))
