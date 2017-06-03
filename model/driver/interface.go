package driver

type DB interface {
	Get(key string) (string, error)
	Put(key, value string) error
	Has(key string) (bool, error)
	Delete(key string) error
	Close() error
	Batch() Batch
	PrefixIterator(prefix string) (Iterator)
	RangeIterator(start, limit string) (Iterator)
}

type Batch interface {
	Put(key, value string)
	Delete(key string)
	Write() error
}

type Iterator interface {
	Seek(key string) bool
	Next() bool
	Key() string
	Value() string
	Release()
	Error() error
}

