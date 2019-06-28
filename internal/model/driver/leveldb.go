package driver

import (
	"github.com/syndtr/goleveldb/leveldb"
	"github.com/syndtr/goleveldb/leveldb/errors"
	"github.com/syndtr/goleveldb/leveldb/iterator"
	"github.com/syndtr/goleveldb/leveldb/util"
)

func OpenLevelDB(path string) (*ldb_wrapper, error) {
	dbh, err := leveldb.OpenFile(path, nil)
	if err != nil {
		return nil, err
	}
	return &ldb_wrapper{dbh}, nil
}

type ldb_wrapper struct {
	db *leveldb.DB
}

func (w *ldb_wrapper) Get(key string) (string, error) {
	v, err := w.db.Get([]byte(key), nil)
	if err == errors.ErrNotFound {
		return "", nil
	}
	return string(v), err
}
func (w *ldb_wrapper) Put(key, value string) error {
	return w.db.Put([]byte(key), []byte(value), nil)
}
func (w *ldb_wrapper) Delete(key string) error {
	return w.db.Delete([]byte(key), nil)
}
func (w *ldb_wrapper) Has(key string) (bool, error) {
	return w.db.Has([]byte(key), nil)
}
func (w *ldb_wrapper) Close() error {
	return w.db.Close()
}
func (w *ldb_wrapper) Batch() Batch {
	return ldb_batch{w.db, new(leveldb.Batch)}
}
func (w *ldb_wrapper) PrefixIterator(prefix string) Iterator {
	return ldb_iterator{w.db.NewIterator(util.BytesPrefix([]byte(prefix)), nil)}
}
func (w *ldb_wrapper) RangeIterator(start, limit string) Iterator {
	return ldb_iterator{w.db.NewIterator(&util.Range{Start: []byte(start), Limit: []byte(limit)}, nil)}
}
func (w *ldb_wrapper) OpenTransaction() (Transaction, error) {
	transaction, err := w.db.OpenTransaction()
	if err != nil {
		return ldb_transaction{}, err
	}
	return ldb_transaction{transaction}, nil
}

type ldb_batch struct {
	db    *leveldb.DB
	batch *leveldb.Batch
}

func (b ldb_batch) Put(key, value string) {
	b.batch.Put([]byte(key), []byte(value))
	return
}
func (b ldb_batch) Delete(key string) {
	b.batch.Delete([]byte(key))
	return
}
func (b ldb_batch) Write() error {
	return b.db.Write(b.batch, nil)
}

type ldb_iterator struct {
	iter iterator.Iterator
}

func (i ldb_iterator) Seek(key string) bool {
	return i.iter.Seek([]byte(key))
}
func (i ldb_iterator) Next() bool {
	return i.iter.Next()
}
func (i ldb_iterator) Key() string {
	return string(i.iter.Key())
}
func (i ldb_iterator) Value() string {
	return string(i.iter.Value())
}
func (i ldb_iterator) Release() {
	i.iter.Release()
	return
}
func (i ldb_iterator) Error() error {
	return i.iter.Error()
}

type ldb_transaction struct {
	transaction *leveldb.Transaction
}

func (t ldb_transaction) Put(key, value string) {
	t.transaction.Put([]byte(key), []byte(value), nil)
	return
}
func (t ldb_transaction) Delete(key string) {
	t.transaction.Delete([]byte(key), nil)
	return
}
func (t ldb_transaction) Commit() error {
	return t.transaction.Commit()
}
func (t ldb_transaction) Discard() {
	t.transaction.Discard()
	return
}
