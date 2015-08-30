const {run, Rx} = require('@cycle/core');
const {h, makeDOMDriver} = require('@cycle/dom');
const timeTravel = require('cycle-time-travel');

function renderTodo (todo) {
  return h('.todo', [
    h('.item', todo.todo),
    h('input.done', {type: 'checkbox', checked: todo.done ? 'checked' : ''})
  ]);
}

function renderTodos (todos) {
  return (
    h('.todos', todos.map(renderTodo))
  );
}

function toggleDone (todos) {
  const todo = todos[0];

  return [{...todo, done: !todo.done}];
}

function todos (DOM) {
  const done$ = DOM.get('.done', 'click')
    .map(ev => ev.target.checked)
    .startWith(false);

  const modifier$ = done$.map(_ => toggleDone);

  const todoState$ = modifier$.scan(
      (state, modifier) => modifier(state),
      [{todo: 'do this', done: true, index: 0}]
    );

  const time = timeTravel(DOM, [
    {stream: todoState$, label: 'todoState$'},
    {stream: done$, label: 'done$'}
  ]);

  function log (label) {
    return (thing) => {
      console.log(label, thing[0]);
      return thing;
    }
  }

  return {
    DOM: Rx.Observable.combineLatest(
      time.timeTravel.todoState$.map(renderTodos),
      time.DOM,
      (todos, timeTravelLog) => h('.app', [todos, timeTravelLog])
    )
  }
}

function main ({DOM}) {
  return {
    DOM: todos(DOM).DOM
  }
}

const drivers = {
  DOM: makeDOMDriver('.cycle')
}

run(main, drivers);
