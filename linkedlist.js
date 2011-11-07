function LinkedList() {
	this.first = null;
	this.last = null;
	this.append = append;
	this.remove = remove;
	this.forEach = forEach;
	this.filter = filter;
}

function append(elem) {
	if (this.first == null) {
		this.first = elem;
		this.last = elem;
	} else {
		this.last.next = elem;
		elem.prev = this.last;
		elem.next = null;
		this.last = elem;
	}
}

function remove(elem) {
	console.log(elem);
	if (elem.prev != null && elem.next != null) {
		elem.prev.next = elem.next;
		elem.next.prev = elem.prev;
		return;
	}
	if (elem.next == null) {
		console.log("next null");
		this.last = elem.prev;
	}   
	if (elem.prev == null) {
		console.log("prev null");
		this.first = elem.next;
	}
	elem.prev = null;
	elem.next = null;
}

function forEach(fun) {
	elem = this.first;
	while (elem != null) {
		fun(elem);
		elem = elem.next;
	}
}

function filter(pred) {
	elem = this.first;
	while (elem != null) {
		if (pred(elem)) {
			nextElem = elem.next;
			this.remove(elem);
			elem = nextElem;
		} else {
			elem = elem.next;
		}
	}
}
