function LinkedList() {
	this.first = null;
	this.last = null;
}

function append(list, elem) {
	if (list.first == null) {
		list.first = elem;
		list.last = elem;
	} else {
		list.last.next = elem;
		elem.prev = list.last;
		elem.next = null;
		list.last = elem;
	}
}

function remove(list, elem) {
	console.log(elem);
	if (elem.prev != null && elem.next != null) {
		elem.prev.next = elem.next;
		elem.next.prev = elem.prev;
		return;
	}
	if (elem.next == null) {
		console.log("next null");
		list.last = elem.prev;
	}   
	if (elem.prev == null) {
		console.log("prev null");
		list.first = elem.next;
	}
	elem.prev = null;
	elem.next = null;
}

function forEach(list, fun) {
	elem = list.first;
	while (elem != null) {
		fun(elem);
		elem = elem.next;
	}
}

function filter(list, pred) {
	elem = list.first;
	while (elem != null) {
		if (pred(elem)) {
			nextElem = elem.next;
			remove(list, elem);
			elem = nextElem;
		} else {
			elem = elem.next;
		}
	}
}
