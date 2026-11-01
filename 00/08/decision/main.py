import copy

import numpy as np
from sklearn.datasets import load_iris
from sklearn.preprocessing import KBinsDiscretizer

dataset_iris = load_iris()
dataset_iris_disc = copy.deepcopy(dataset_iris)
dataset_iris_disc.data = (
    KBinsDiscretizer(n_bins=3, encode="ordinal", strategy="uniform")
    .fit_transform(dataset_iris_disc.data)
    .astype(int)
)

def _entropy(values):
    _, counts = np.unique(values, return_counts=True)
    p = counts / counts.sum()
    return -(p * np.log(p)).sum()


def entryopy(dataset, subset_indices):
    return _entropy(dataset.target[subset_indices])


def cond_entryopy(dataset, subset_indices, feature_index):
    features = dataset.data[subset_indices, feature_index]
    n = len(subset_indices)
    total = 0.0
    for v in np.unique(features):
        group = subset_indices[features == v]
        total += len(group) / n * entryopy(dataset, group)
    return total


def info_gain(dataset, subset_indices, feature_index):
    return entryopy(dataset, subset_indices) - cond_entryopy(
        dataset, subset_indices, feature_index
    )


def info_gains(dataset, subset_indices, feature_indices):
    return [info_gain(dataset, subset_indices, i) for i in feature_indices]


def info_gain_ratio(dataset, subset_indices, feature_index):
    split_info = _entropy(dataset.data[subset_indices, feature_index])
    if split_info == 0:
        return 0.0
    return info_gain(dataset, subset_indices, feature_index) / split_info


def info_gain_ratios(dataset, subset_indices, feature_indices):
    return [info_gain_ratio(dataset, subset_indices, i) for i in feature_indices]


class Node:
    def __init__(
        self, dataset, feature_index=None, value=None, children=None, label=None
    ):
        self.dataset = dataset
        self.feature_index = feature_index
        self.children = children or {}
        self.label = label

    def _show(self, indent, value=None):
        to_show = ""
        if value is not None:
            to_show += f"{value} "
        to_show += "(node)"
        if self.feature_index is not None:
            to_show += f" {self.dataset.feature_names[self.feature_index]}"
        if self.label is not None:
            to_show += f" -> {self.dataset.target_names[self.label]}"
        print("    " * indent + to_show)
        for v in self.children:
            self.children[v]._show(indent + 1, v)

    def show(self):
        self._show(0, None)

    def is_leaf(self):
        return len(self.children) == 0

    def predict(self, x):
        node = self
        while not node.is_leaf() and x[node.feature_index] in node.children:
            node = node.children[x[node.feature_index]]
        return node.label


def _majority(targets):
    vals, counts = np.unique(targets, return_counts=True)
    return vals[np.argmax(counts)]


def _build_id3(dataset, subset_indices, available_features):
    targets = dataset.target[subset_indices]

    if len(np.unique(targets)) == 1:
        return Node(dataset, label=targets[0])

    majority = _majority(targets)
    if len(available_features) == 0:
        return Node(dataset, label=majority)

    igs = info_gains(dataset, subset_indices, available_features)
    best_feature = available_features[int(np.argmax(igs))]

    node = Node(dataset, feature_index=best_feature, label=majority)
    features = dataset.data[subset_indices, best_feature]
    remaining = [f for f in available_features if f != best_feature]
    for v in np.unique(features):
        child_indices = subset_indices[features == v]
        child = _build_id3(dataset, child_indices, remaining)
        node.children[v] = child
    return node


def id3(dataset):
    n_features = dataset.data.shape[1]
    return _build_id3(dataset, np.arange(len(dataset.target)), list(range(n_features)))

def predict(node, x):
    while not node.is_leaf() and x[node.feature_index] in node.children:
        node = node.children[x[node.feature_index]]
    return node.label

node = id3(dataset_iris_disc)
node.show()
