using System.Linq.Expressions;
using System.Text;

namespace Repositories.Models
{
    public class ComboboxItem
    {
        public string Name { get; set; }
        public object Value { get; set; }
        public bool Checked { get; set; }
        public string ExtraProps { get; set; }
    }

    public class TablePageParameter
    {
        public int PageIndex { get; set; }

        public int PageSize { get; set; }

        public string SortKey { get; set; } = string.Empty;

        public bool IsAscending { get; set; }

        public string SearchContent { get; set; }

        public Dictionary<string, List<string>> Filters { get; set; } = new();

        public override string ToString()
        {
            StringBuilder filtersString = new StringBuilder();
            foreach (var filter in Filters)
            {
                filtersString.AppendLine($"{filter.Key}: {string.Join(", ", filter.Value)}");
            }
            return $@"
PageIndex: {PageIndex}
PageSize: {PageSize}
SortKey: {SortKey}
IsAscending: {IsAscending}
SearchContent: {SearchContent}
Filters count: {Filters.Count}
{filtersString}
";


        }
    }

    public class TableQueryParameter<T, TOrder>
    {
        public Pager Pager { get; set; } = new Pager();
        public Expression<Func<T, bool>> Filter { get; set; }
        public List<string> IncludedPropertyList { get; set; }
        public Sorter<T, TOrder> Sorter { get; set; } = new Sorter<T, TOrder>();
    }

    public class TableInfo<T>
    {
        public List<T> Items { get; set; } = new();
        public int PageCount { get; set; } = 1;
        public int TotalItemsCount { get; set; }

        public override string ToString()
        {
            return $@"
TotalItemsCount: {TotalItemsCount}
PageCount      : {PageCount}";
        }
    }

    public class Pager
    {
        public int Index { get; set; }
        public int Size { get; set; }
    }

    public class Sorter<T, TResult>
    {
        public Expression<Func<T, TResult>> SortBy { get; set; }
        public Expression<Func<T, TResult>> ThenSortBy { get; set; }
        public bool IsAscending { get; set; }
    }

    public class DataCountInfo<T>
    {
        public List<T> Items { get; set; }
        public int TotalItemsCount { get; set; }
    }


    public class FilterKey
    {
        public const string User = "Users";
    }

    public class OperationResult<T>
    {
        public List<T> Items { get; set; }
        public OperationResultStatus Status { get; set; }
        public string Message { get; set; }
        public string Resource { get; set; }
    }

    public class OperationResultItem
    {
        public string Name { get; set; }
        public object Value { get; set; }
    }

    public enum OperationResultStatus
    {
        Success = 0,
        Fail,
        Warn
    }
}
