const express = require('express')
const bodyParser = require('body-parser')
const date = require(__dirname + '/date.js')
const mongoose = require('mongoose')
const _ = require('lodash')

const app = express()

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'))

mongoose.connect('mongodb+srv://rotrixx:wL4edUZRax2Ke2Uh@cluster0.qylanps.mongodb.net/todolistDB')

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema)
const item1 = new Item ({
  name: 'Bienvenido a tu todolist!'
})

const item2 = new Item ({
  name: 'Presiona el boton + para crear un item nuevo.'
})

const item3 = new Item ({
  name: '<-- Presiona esto para eliminar un item.'
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List', listSchema)

app.get('/', function(req, res) {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Successfully saved default items to DB')
        }
      })
      res.redirect('/')
    } else {
      res.render('list', {listTitle: "Hoy", newListItems: foundItems})
    }
  })


})

app.post('/', async function(req, res){
  const listName = req.body.list
  const item = new Item ({
    name: req.body.newItem
  })


  if (listName === "Hoy") {
    await item.save()
    res.redirect('/')
  } else {
    List.findOne({name: listName}, async (err, foundList) => {
      foundList.items.push(item)
      await foundList.save()
      res.redirect(`/${listName}`)
    })
  }

})

app.post('/delete', (req, res) => {
  const listName = req.body.listName

  if (listName === "Hoy") {
    Item.findByIdAndRemove(req.body.checkbox, (err) => {
      if (!err){
        res.redirect('/')
      } else {
        console.log(err)
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: req.body.checkbox}}}, (err, foundList) => {
      if (!err){
        res.redirect(`/${listName}`)
      } else {
        console.log(err)
        res.redirect(`/${listName}`)
      }
    })
  }
})


app.get('/:customListName', (req, res) => {
  List.findOne({name: req.params.customListName}, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: req.params.customListName,
          items: defaultItems
        })
        list.save()
        res.redirect('/' + req.params.customListName)
      } else {
        res.render('list', {listTitle: _.capitalize(foundList.name), newListItems: foundList.items})
      }
    }
  })
})

app.get('/about', function(req, res){
  res.render('about')
})

app.listen(3000, function() {
  console.log('Server started on port 3000')
})