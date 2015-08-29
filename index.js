const {run, Rx} = require('@cycle/core');
const {h, makeDOMDriver} = require('@cycle/dom');
const timeTravel = require('cycle-time-travel');

function renderTodo (todo) {
  return h('.todo', [
    h('.item', todo.todo),
    h('input.done', {type: 'checkbox', checked: todo.done})
  ]);
}

function renderTodos (todos) {
  return (
    h('.todos', todos.map(renderTodo))
  );
}

function todos (DOM) {
  const todoState$ = Rx.Observable.just([
    {todo: 'do this', done: false}
  ]);

  const time = timeTravel(DOM, [
    {stream: todoState$, label: 'todoState$'}
  ])

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
