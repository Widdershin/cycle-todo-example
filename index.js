const {run, Rx} = require('@cycle/core');
const {h, makeDOMDriver} = require('@cycle/dom');
const timeTravel = require('cycle-time-travel');

const getId = (() => {
  let _id = 0;

  return () => {
    _id += 1;
    return _id;
  }
}());

function renderTodo (todo) {
  return h('.todo', [
    h('.item', todo.todo),
    h('input.done', {
      type: 'checkbox',
      checked: todo.done ? 'checked' : '',
      attributes: {'data-id': todo.id}
    })
  ]);
}

function renderTodos (todos) {
  return (
    h('.todos', todos.map(renderTodo))
  );
}

function toggleDone (id) {
  return (todos) => {
    return todos.map(todo => {
      if (id === todo.id) {
        return {...todo, done: !todo.done};
      }

      return todo;
    });
  }
}

function newTodo (todo) {
  return (todos) => {
    return [...todos, {todo, done: false, id: getId()}];
  }
}

function newTodoForm () {
  return (
    h('.new-todo', [
      h('input.new-todo-name'),
      h('button.create-new-todo', 'New todo')
    ])
  );
}

function todos (DOM) {
  const toggleDone$ = DOM.get('.done', 'click')
    .map(ev => parseInt(ev.target.dataset.id, 10))

  const newTodo$ = DOM.get('.new-todo-name', 'change')
    .map(ev => ev.target.value)
    .sample(DOM.get('.create-new-todo', 'click'));

  const modifier$ = Rx.Observable.merge(
    toggleDone$.map(toggleDone),
    newTodo$.map(newTodo)
  );

  const todoState$ = modifier$.scan(
      (state, modifier) => modifier(state),
      []
    ).startWith([]);

  const time = timeTravel(DOM, [
    {stream: todoState$, label: 'todoState$'},
    {stream: toggleDone$, label: 'toggleDone$'},
    {stream: newTodo$, label: 'newTodo$'}
  ]);

  function log (label) {
    return (thing) => {
      console.log(label, thing);
      return thing;
    }
  }

  return {
    DOM: Rx.Observable.combineLatest(
      time.timeTravel.todoState$.map(renderTodos),
      time.DOM,
      (todos, timeTravelLog) => h('.app', [
        newTodoForm(),
        todos,
        timeTravelLog
      ])
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
