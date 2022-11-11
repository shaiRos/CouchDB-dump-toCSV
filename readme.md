use couchdb-dump.sh to create dump json file for a database in a couchdb instance (see inside for instructions) (from: https://github.com/danielebailo/couchdb-dump)
use git bash cmd!! not wsl/normal cmd bash to run .sh file

two options to convert dump json data
  Rows version (csv) questions in columns individual user answers are in rows
  Tabs version (xlsx) where each question are in a tab, and # & % of people who answered the question/amount of people answered x
  ** Similar format to Survey monkey exports

takes in array of json objects (couchdbDocs) representing individual user answers to survey questions

